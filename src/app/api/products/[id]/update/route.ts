import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import User from '@/models/User';
import PriceUpdate from '@/models/PriceUpdate';
import PriceRequest from '@/models/PriceRequest';
import GamificationRule from '@/models/GamificationRule';
import { parsePriceRange } from '@/lib/price-utils';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

const REPUTATION_WEIGHTS = {
    'Beginner': 1,
    'Trusted Contributor': 3,
    'Elite Contributor': 10,
};

interface DecodedToken {
    id: string;
    name: string;
    email: string;
    role: string;
}

async function getUserFromToken() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;
    try {
        const decoded = verifyToken(token);
        if (decoded && typeof decoded === 'object') {
            return decoded as unknown as DecodedToken;
        }
        return null;
    } catch {
        return null;
    }
}

function calculateMedian(values: number[]) {
    if (values.length === 0) return 0;
    values.sort((a, b) => a - b);
    const half = Math.floor(values.length / 2);
    if (values.length % 2) return values[half];
    return (values[half - 1] + values[half]) / 2.0;
}

function removeOutliers(values: number[]) {
    if (values.length < 3) return values; // Not enough data to reliably find standard deviation
    const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length);
    // Keep values within 2 standard deviations
    return values.filter(v => Math.abs(v - mean) <= 2 * stdDev);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    let productId: string = 'unknown';
    try {
        const resolvedParams = await params;
        productId = resolvedParams.id;

        let body: any;
        try {
            body = await req.json();
        } catch (e) {
            console.warn('[Price Update] Failed to parse JSON body');
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const price = body?.price;
        const storeLocation = body?.storeLocation;
        console.log('[Price Update] Starting:', { productId, price, storeLocation });

        if (price === undefined || price === null || typeof price !== 'number' || price <= 0) {
            return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
        }

        const decodedToken = await getUserFromToken();
        if (!decodedToken || !decodedToken.id) {
            return NextResponse.json({ error: 'Authentication required to update price. Anonymous updates are not allowed.' }, { status: 401 });
        }

        await connectDB();

        const user = await User.findById(decodedToken.id);
        if (!user) {
            console.error('[Price Update] User not found in DB:', decodedToken.id);
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        if (user.isBanned) {
            return NextResponse.json({ error: 'Your account has been banned from submitting price updates.' }, { status: 403 });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        console.log('[Price Update] Pre-check passed', { userId: user._id, productId: product._id });

        // 1. Spam Prevention & Daily Limits (Relaxed for testing)
        const relaxationPeriod = 10 * 1000;
        const limitTime = new Date(Date.now() - relaxationPeriod);
        const existingUpdate = await PriceUpdate.findOne({
            productId: product._id,
            userId: user._id,
            createdAt: { $gte: limitTime }
        });

        if (existingUpdate) {
            return NextResponse.json({ error: 'You have already updated this product recently.' }, { status: 429 });
        }

        // Fetch Gamification Rules
        let rule = await GamificationRule.findOne();
        if (!rule) rule = await GamificationRule.create({});

        // Check daily limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!user.lastRewardedDate || user.lastRewardedDate < today) {
            user.rewardedUpdatesToday = 0;
            user.lastRewardedDate = today;
        }

        if (user.rewardedUpdatesToday >= rule.dailyUpdateLimit) {
            return NextResponse.json({ error: 'Daily update limit reached.' }, { status: 429 });
        }

        // 2. Create the update record
        console.log('[Price Update] Creating Record...');
        const parsedPrice = parsePriceRange(price);
        const newUpdate = await PriceUpdate.create({
            productId: product._id,
            userId: user._id,
            price: parsedPrice.price,
            maxPrice: parsedPrice.maxPrice,
            storeLocation: storeLocation,
            status: 'pending'
        });

        // 3. Process verification
        const recentUpdates = await PriceUpdate.find({
            productId: product._id,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }).populate('userId', 'reputationLevel points');

        const rawPrices = recentUpdates.map(u => u.price);
        const validPrices = removeOutliers(rawPrices);
        const newMedianPrice = calculateMedian(validPrices);

        let totalWeight = 0;
        let validReportCount = 0;

        for (const update of recentUpdates) {
            if (validPrices.includes(update.price)) {
                validReportCount++;
                const updaterReputation = (update.userId as any)?.reputationLevel || 'Beginner';
                totalWeight += REPUTATION_WEIGHTS[updaterReputation as keyof typeof REPUTATION_WEIGHTS] || 1;
            }
        }

        console.log('[Price Update] Calculated Weight:', { totalWeight, threshold: rule.verificationThreshold });

        product.reportCount = validReportCount;
        product.confidenceLevel = (validReportCount >= 5 ? 'High' : validReportCount >= 2 ? 'Medium' : 'Low') as any;

        if (totalWeight >= rule.verificationThreshold) {
            console.log('[Price Update] Threshold reached, updating product...');

            // Safeguard against division by zero or NaN
            const oldPrice = product.price || 1;
            const diffPercent = Math.abs(newMedianPrice - oldPrice) / oldPrice;

            if (diffPercent > 0.50) {
                product.flagged = true;
            } else {
                product.price = newMedianPrice;
                product.flagged = false;
                product.lastUpdated = new Date();
                product.lastUpdatedBy = user.name || 'Anonymous';
            }
            product.updateRequested = false;

            // Mark updates verified & award points
            for (const update of recentUpdates) {
                if (validPrices.includes(update.price) && update.status === 'pending') {
                    await PriceUpdate.findByIdAndUpdate(update._id, { status: 'verified' });

                    const updaterId = (update.userId as any)?._id || update.userId;
                    if (updaterId) {
                        const updater = await User.findById(updaterId);
                        if (updater && updater.rewardedUpdatesToday < rule.dailyUpdateLimit) {
                            updater.points += rule.pointsPerUpdate;
                            updater.rewardedUpdatesToday += 1;

                            if (updater.points >= 500 && updater.reputationLevel === 'Beginner') {
                                updater.reputationLevel = 'Trusted Contributor';
                            } else if (updater.points >= 2000 && updater.reputationLevel === 'Trusted Contributor') {
                                updater.reputationLevel = 'Elite Contributor';
                            }
                            await updater.save();
                        }
                    }
                }
            }

            const openRequest = await PriceRequest.findOne({ productId: product._id, status: 'open' });
            if (openRequest) {
                openRequest.status = 'fulfilled';
                openRequest.fulfilledBy = user._id;
                await openRequest.save();
                user.points += rule.bonusPointsRequest;
            }
        }

        await product.save();
        await user.save();

        console.log('[Price Update] Finished Successfully');

        return NextResponse.json({
            message: 'Price update submitted successfully',
            verified: totalWeight >= rule.verificationThreshold,
            confidenceLevel: product.confidenceLevel,
            newMedianPrice: newMedianPrice
        });

    } catch (error: any) {
        console.error('[Price Update] CRITICAL ERROR:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            productId
        });
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
