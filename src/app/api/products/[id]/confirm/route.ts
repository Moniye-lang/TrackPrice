import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import PriceUpdate from '@/models/PriceUpdate';
import User from '@/models/User';
import GamificationRule from '@/models/GamificationRule';
import { getServerUser } from '@/lib/server-auth';

const REPUTATION_WEIGHTS = {
    'Beginner': 1,
    'Trusted Contributor': 5,
    'Elite Contributor': 15,
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: productId } = await params;
    const userPayload = await getServerUser();

    try {
        console.log(`[Confirm API] Starting... Product: ${productId}`);
        await connectDB();
        const body = await req.json();
        const { updateId } = body;
        console.log(`[Confirm API] UpdateID: ${updateId}, UserID: ${userPayload ? userPayload.id : 'anonymous'}`);

        if (!updateId) {
            return NextResponse.json({ error: 'Update ID is required' }, { status: 400 });
        }

        const product = await Product.findById(productId);
        if (!product) {
            console.error(`[Confirm API] Product NOT FOUND: ${productId}`);
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const update = await PriceUpdate.findById(updateId);
        if (!update || update.status !== 'pending') {
            console.error(`[Confirm API] Update NOT FOUND or NOT PENDING: ${updateId}`);
            return NextResponse.json({ error: 'Pending update not found' }, { status: 404 });
        }

        // Check if user already confirmed or is the original submitter
        const currentUserIdStr = userPayload ? userPayload.id.toString() : 'anonymous';
        const submitterIdStr = update.userId?.toString();

        if (submitterIdStr && submitterIdStr === currentUserIdStr) {
            return NextResponse.json({ error: 'You cannot confirm your own price report' }, { status: 400 });
        }

        update.confirmations = update.confirmations || [];
        update.anonymousConfirmations = update.anonymousConfirmations || [];

        if (userPayload && update.confirmations.some(cid => cid?.toString() === currentUserIdStr)) {
            return NextResponse.json({ error: 'You have already confirmed this price' }, { status: 400 });
        }

        // Add confirmation
        const mongoose = require('mongoose');
        if (userPayload) {
            console.log(`[Confirm API] Adding confirmation for user: ${currentUserIdStr}`);
            update.confirmations.push(new mongoose.Types.ObjectId(currentUserIdStr));
        } else {
            console.log(`[Confirm API] Adding anonymous confirmation`);
            // We just add a generic anonymous token or IP hash. Here we use 'anonymous' since we don't have good IP from req easily
            update.anonymousConfirmations.push('anonymous');
        }
        await update.save();

        process.stdout.write('[Confirm API] Confirmation saved. Calculating weights...\n');

        // Calculate total weight to see if we can verify now
        const submitter = await User.findById(update.userId);
        const confirmers = await User.find({ _id: { $in: update.confirmations } });

        let totalWeight = submitter ? (REPUTATION_WEIGHTS[submitter.reputationLevel as keyof typeof REPUTATION_WEIGHTS] || 1) : 1;
        for (const confirmer of confirmers) {
            const weight = REPUTATION_WEIGHTS[confirmer.reputationLevel as keyof typeof REPUTATION_WEIGHTS] || 1;
            console.log(`[Confirm API] Confirmer: ${confirmer.name}, Weight: ${weight}`);
            totalWeight += weight;
        }

        console.log(`[Confirm API] Total Weight: ${totalWeight}`);

        // Safe Rule Lookup
        let threshold = 5;
        try {
            const rule = await GamificationRule.findOne(); // Just get the global rule for now
            if (rule) threshold = rule.verificationThreshold || 5;
        } catch (ruleErr) {
            console.warn('[Confirm API] GamificationRule lookup failed, using default threshold 5');
        }
        
        console.log(`[Confirm API] Threshold: ${threshold}`);

        let verified = false;
        if (totalWeight >= threshold) {
            console.log(`[Confirm API] Threshold reached (${totalWeight}/${threshold}). Verifying price...`);
            
            // Record history and update product
            product.priceHistory = product.priceHistory || [];
            product.priceHistory.push({ 
                price: update.price, 
                maxPrice: update.maxPrice, 
                verifiedAt: new Date() 
            });
            
            product.price = update.price;
            if (update.maxPrice) product.maxPrice = update.maxPrice;
            product.flagged = false;
            product.lastUpdated = new Date();
            product.lastUpdatedBy = 'Community Consensus';
            
            console.log(`[Confirm API] Saving product: ${product.name}`);
            await product.save();
            
            update.status = 'verified';
            console.log(`[Confirm API] Finalizing update status`);
            await update.save();
            verified = true;
        }

        return NextResponse.json({
            message: verified ? 'Price verified by community consensus!' : 'Your confirmation has been recorded',
            verified,
            totalWeight,
            threshold
        });

    } catch (error: any) {
        console.error('[Confirm API] CRASHED:', error);
        return NextResponse.json({ 
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
