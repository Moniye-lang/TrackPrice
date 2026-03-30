import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db';
import PriceUpdate from '@/models/PriceUpdate';
import ScrapedProduct from '@/models/ScrapedProduct';
import Product from '@/models/Product';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

async function getAdminFromToken() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const decodedToken = await getAdminFromToken();
        if (!decodedToken || decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { items, sourceUrl, location } = await req.json();

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'No items provided for approval.' }, { status: 400 });
        }

        await connectDB();

        let approvedCount = 0;
        let queuedCount = 0;

        for (const item of items) {
            if (item.status === 'rejected') continue;

            if (item.matchedProductId) {
                // Create a pending PriceUpdate
                await PriceUpdate.create({
                    productId: item.matchedProductId,
                    userId: decodedToken.id as string, // Admins act as the submitter
                    price: item.price,
                    storeLocation: location || undefined,
                    status: 'pending' // Still requires verification per system logic
                });
                approvedCount++;
            } else {
                // Create a new Product directly instead of queueing it
                await Product.create({
                    name: item.name,
                    price: item.price,
                    category: 'Uncategorized',
                    imageUrl: item.imageUrl || `https://placehold.co/600x400?text=${encodeURIComponent(item.name)}`,
                    storeLocation: location || undefined,
                    reportCount: 0,
                    confidenceLevel: 'Low',
                    priceHistory: [{
                        price: item.price,
                        verifiedAt: new Date()
                    }]
                });
                queuedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${items.length} items. Created ${approvedCount} PriceUpdates and queued ${queuedCount} unmatched items.`,
        });

    } catch (error: any) {
        console.error('Error in /api/admin/scrape/approve:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
