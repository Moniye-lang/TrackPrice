import { NextResponse } from 'next/server';
import { isServerAdmin } from '@/lib/server-auth';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import PriceUpdate from '@/models/PriceUpdate';

export async function GET() {
    try {
        if (!(await isServerAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const onlineKeywords = ['supermart', 'jumia', 'konga', 'chowdeck', 'glovo', 'amazon', 'ebay', 'aliexpress'];
        
        // Construct regex for keywords
        const regex = new RegExp(onlineKeywords.join('|'), 'i');

        // Update Products
        const productResult = await (Product as any).updateMany(
            { 
                $or: [
                    { name: regex },
                    { brand: regex },
                    { storeLocation: regex }
                ],
                marketCategory: { $nin: ['Online', 'Physical'] }
            },
            { $set: { marketCategory: 'Online' } }
        );

        // Update PriceUpdates
        const updateResult = await (PriceUpdate as any).updateMany(
            { 
                storeLocation: regex,
                marketCategory: { $nin: ['Online', 'Physical'] }
            },
            { $set: { marketCategory: 'Online' } }
        );

        return NextResponse.json({
            success: true,
            message: `Migration complete.`,
            productsModified: productResult.modifiedCount,
            updatesModified: updateResult.modifiedCount
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
