import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import PriceUpdate from '@/models/PriceUpdate';
import GamificationRule from '@/models/GamificationRule';
import crypto from 'crypto';

function getIpHash(req: Request) {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
    return crypto.createHash('sha256').update(ip).digest('hex');
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: productId } = await params;
    const ipHash = getIpHash(req);

    try {
        await connectDB();
        const body = await req.json();
        const { updateId } = body;

        if (!updateId) {
            return NextResponse.json({ error: 'Update ID is required' }, { status: 400 });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const update = await PriceUpdate.findById(updateId);
        if (!update || update.status !== 'pending') {
            return NextResponse.json({ error: 'Pending proposal not found' }, { status: 404 });
        }

        // Check if this IP has already vouched
        update.anonymousConfirmations = update.anonymousConfirmations || [];
        if (update.anonymousConfirmations.includes(ipHash)) {
            return NextResponse.json({ error: 'You have already vouched for this price' }, { status: 400 });
        }

        // Add anonymous confirmation
        update.anonymousConfirmations.push(ipHash);
        await update.save();

        // Calculate total weight (Anonymous vouches count less or have a different threshold)
        // For now, let's say 3 anonymous vouches = 1 point of weight, or just count them separately
        const anonWeight = update.anonymousConfirmations.length;
        
        // Let's assume 3 anonymous vouches is enough to "verify" if the product is stale
        const threshold = 3; 

        let verified = false;
        if (anonWeight >= threshold) {
            product.priceHistory.push({ 
                price: update.price, 
                maxPrice: update.maxPrice, 
                verifiedAt: new Date() 
            });
            product.price = update.price;
            if (update.maxPrice) product.maxPrice = update.maxPrice;
            product.lastUpdated = new Date();
            product.lastUpdatedBy = 'Community Vouch';
            
            await product.save();
            
            update.status = 'verified';
            await update.save();
            verified = true;
        }

        return NextResponse.json({
            message: verified ? 'Price verified by community!' : 'Your vouch has been recorded',
            verified,
            currentVouches: anonWeight,
            threshold
        });

    } catch (error: any) {
        console.error('[Vouch API] CRASHED:', error);
        return NextResponse.json({ 
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
