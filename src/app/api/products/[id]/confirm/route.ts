import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import PriceUpdate from '@/models/PriceUpdate';
import User from '@/models/User';
import GamificationRule from '@/models/GamificationRule';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

async function getUser() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch (error) {
        return null;
    }
}

const REPUTATION_WEIGHTS = {
    'Beginner': 1,
    'Trusted Contributor': 5,
    'Elite Contributor': 15,
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: productId } = await params;
    const userPayload = await getUser();

    if (!userPayload) {
        return NextResponse.json({ error: 'Authentication required to confirm prices' }, { status: 401 });
    }

    try {
        await connectDB();
        const body = await req.json();
        const { updateId } = body;
        console.log(`[Confirm API] Product: ${productId}, UpdateID: ${updateId}`, body);

        if (!updateId) {
            return NextResponse.json({ error: 'Update ID is required' }, { status: 400 });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const update = await PriceUpdate.findById(updateId);
        if (!update || update.status !== 'pending') {
            return NextResponse.json({ error: 'Pending update not found' }, { status: 404 });
        }

        // Check if user already confirmed or is the original submitter
        if (update.userId.toString() === userPayload.userId) {
            return NextResponse.json({ error: 'You cannot confirm your own price report' }, { status: 400 });
        }

        if (update.confirmations.some(cid => cid.toString() === userPayload.userId)) {
            return NextResponse.json({ error: 'You have already confirmed this price' }, { status: 400 });
        }

        // Add confirmation
        update.confirmations.push(userPayload.userId as any);
        await update.save();

        // Calculate total weight to see if we can verify now
        const submitter = await User.findById(update.userId);
        const confirmers = await User.find({ _id: { $in: update.confirmations } });

        let totalWeight = submitter ? (REPUTATION_WEIGHTS[submitter.reputationLevel as keyof typeof REPUTATION_WEIGHTS] || 1) : 1;
        for (const confirmer of confirmers) {
            totalWeight += REPUTATION_WEIGHTS[confirmer.reputationLevel as keyof typeof REPUTATION_WEIGHTS] || 1;
        }

        const rule = await GamificationRule.findOne({ category: product.category }) || 
                     await GamificationRule.findOne({ category: 'Default' });
        
        const threshold = rule?.verificationThreshold || 5;

        let verified = false;
        if (totalWeight >= threshold) {
            console.log(`[Confirm API] Threshold reached (${totalWeight}/${threshold}). Verifying price...`);
            
            // Record history and update product
            product.priceHistory.push({ price: update.price, maxPrice: update.maxPrice, verifiedAt: new Date() });
            product.price = update.price;
            if (update.maxPrice) product.maxPrice = update.maxPrice;
            product.flagged = false;
            product.lastUpdated = new Date();
            product.lastUpdatedBy = 'Community Consensus';
            product.confidenceLevel = (totalWeight >= 15 ? 'High' : totalWeight >= 5 ? 'Medium' : 'Low') as any;
            
            await product.save();
            
            update.status = 'verified';
            await update.save();
            verified = true;

            // Optional: Award points to the original submitter and confirmers
            // (Skipping for brevity in MVP but highly recommended)
        }

        return NextResponse.json({
            message: verified ? 'Price verified by community consensus!' : 'Your confirmation has been recorded',
            verified,
            totalWeight,
            threshold
        });

    } catch (error: any) {
        console.error('[Confirm API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
