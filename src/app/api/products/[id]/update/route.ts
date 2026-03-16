import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import User from '@/models/User';
import PriceUpdate from '@/models/PriceUpdate';
import PriceRequest from '@/models/PriceRequest';
import GamificationRule from '@/models/GamificationRule';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

const REPUTATION_WEIGHTS = {
    'Beginner': 1,
    'Trusted Contributor': 3,
    'Elite Contributor': 10,
};

async function getUserFromToken() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
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
    try {
        const { id } = await params;
        const { price } = await req.json();

        if (!price || typeof price !== 'number' || price <= 0) {
            return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
        }

        const decodedToken = await getUserFromToken();
        if (!decodedToken || typeof decodedToken.id !== 'string') {
            return NextResponse.json({ error: 'Authentication required to update price. Anonymous updates are not allowed.' }, { status: 401 });
        }

        await connectDB();

        const user = await User.findById(decodedToken.id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        if (user.isBanned) {
            return NextResponse.json({ error: 'Your account has been banned from submitting price updates.' }, { status: 403 });
        }

        // Fetch Gamification Rules
        let rule = await GamificationRule.findOne();
        if (!rule) {
            rule = await GamificationRule.create({}); // fallback to defaults
        }

        const product = await Product.findById(id);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // 1. Spam Prevention & Daily Limits
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existingUpdate = await PriceUpdate.findOne({
            productId: product._id,
            userId: user._id,
            createdAt: { $gte: oneDayAgo }
        });

        if (existingUpdate) {
            return NextResponse.json({ error: 'You have already updated this product in the last 24 hours.' }, { status: 429 });
        }

        // Check daily limit for rewards
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!user.lastRewardedDate || user.lastRewardedDate < today) {
            user.rewardedUpdatesToday = 0;
            user.lastRewardedDate = today;
        }

        if (user.rewardedUpdatesToday >= rule.dailyUpdateLimit) {
            return NextResponse.json({ error: 'Daily update limit reached. You can no longer earn points today.' }, { status: 429 });
        }

        // Create the individual price update record
        const updateData: any = {
            productId: product._id,
            userId: user._id,
            price: price,
            status: 'pending' // Defaults to pending
        };

        const newUpdate = new PriceUpdate(updateData);
        await newUpdate.save();

        // 2. Fetch all recent updates to calculate median & verification
        const recentUpdates = await PriceUpdate.find({
            productId: product._id,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        }).populate('userId', 'reputationLevel points');

        const rawPrices = recentUpdates.map(u => u.price);
        const validPrices = removeOutliers(rawPrices);
        const newMedianPrice = calculateMedian(validPrices);

        // 3. Calculate Trust Weight & Confidence
        let totalWeight = 0;
        let validReportCount = 0;

        for (const update of recentUpdates) {
            // Only count if within acceptable outlier range (approximate check based on median)
            if (validPrices.includes(update.price)) {
                validReportCount++;
                const updaterReputation = (update.userId as any)?.reputationLevel || 'Beginner';
                totalWeight += REPUTATION_WEIGHTS[updaterReputation as keyof typeof REPUTATION_WEIGHTS] || 1;
            }
        }

        let confidenceLevel = 'Low';
        if (validReportCount >= 5) confidenceLevel = 'High';
        else if (validReportCount >= 2) confidenceLevel = 'Medium';

        product.reportCount = validReportCount;
        product.confidenceLevel = confidenceLevel as 'Low' | 'Medium' | 'High';

        // 4. Verification Logic
        if (totalWeight >= rule.verificationThreshold) {
            // Update the main product price

            // Safeguard: check for massive percentage change
            const diffPercent = Math.abs(newMedianPrice - product.price) / product.price;
            if (diffPercent > 0.50) { // 50% change
                product.flagged = true;
                // Keep the old price until unflagged manually, but store the requested state
            } else {
                product.price = newMedianPrice;
                product.flagged = false;
                product.lastUpdated = new Date();
            }

            product.updateRequested = false;

            // Mark updates as verified and award points if not already awarded
            const pointsToAward = rule.pointsPerUpdate;
            for (const update of recentUpdates) {
                if (validPrices.includes(update.price) && update.status === 'pending') {
                    update.status = 'verified';
                    await update.save();

                    if (update.userId) {
                        const updater = await User.findById(update.userId);
                        if (updater && updater.rewardedUpdatesToday < rule.dailyUpdateLimit) {
                            updater.points += pointsToAward;
                            updater.rewardedUpdatesToday += 1;
                            // Promotion logic
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

            // Check if there was an open Price Request, resolve it and award bonus
            const openRequest = await PriceRequest.findOne({ productId: product._id, status: 'open' });
            if (openRequest) {
                openRequest.status = 'fulfilled';
                openRequest.fulfilledBy = user._id; // The user who pushed it over the threshold gets the bonus
                await openRequest.save();

                user.points += rule.bonusPointsRequest; // Bonus points for fulfilling a request
            }
        } else {
            // Not enough weight yet, store the pending state (keep the old price)
        }

        await product.save();
        await user.save(); // Save initial update count/points if modified

        return NextResponse.json({
            message: 'Price update submitted successfully',
            verified: totalWeight >= rule.verificationThreshold,
            confidenceLevel: product.confidenceLevel,
            newMedianPrice: newMedianPrice
        });

    } catch (error: any) {
        console.error('[Price Update] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
