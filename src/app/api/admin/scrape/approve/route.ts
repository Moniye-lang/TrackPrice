import { NextResponse } from 'next/server';
import { isServerAdmin, getServerUser } from '@/lib/server-auth';
import { revalidateProducts } from '@/lib/cache';
import connectDB from '@/lib/db';
import PriceUpdate from '@/models/PriceUpdate';
import ScrapedProduct from '@/models/ScrapedProduct';
import Product from '@/models/Product';

export async function POST(req: Request) {
    try {
        if (!(await isServerAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const user = await getServerUser();

        const { items, sourceUrl, location, marketCategory } = await req.json();

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
                    userId: user?.id as string,
                    price: item.price,
                    storeLocation: marketCategory === 'Online' ? undefined : (location || undefined),
                    marketCategory: marketCategory || 'Physical',
                    status: 'pending'
                });
                approvedCount++;
            } else {
                // Create a new Product
                await Product.create({
                    name: item.name,
                    price: item.price,
                    category: item.category || 'Uncategorized',
                    marketCategory: marketCategory || 'Physical',
                    imageUrl: item.imageUrl || `https://placehold.co/600x400?text=${encodeURIComponent(item.name)}`,
                    storeLocation: marketCategory === 'Online' ? undefined : (location || undefined),
                    reportCount: 0,
                    priceHistory: [{
                        price: item.price,
                        verifiedAt: new Date()
                    }]
                });
                approvedCount++;
                queuedCount++;
            }
        }

        revalidateProducts(); // Invalidate cache

        return NextResponse.json({
            success: true,
            message: `Processed ${items.length} items. Created ${approvedCount} PriceUpdates and queued ${queuedCount} unmatched items.`,
        });

    } catch (error: any) {
        console.error('Error in /api/admin/scrape/approve:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
