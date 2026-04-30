import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import AuditLog from '@/models/AuditLog';
import { isServerAdmin, getServerUser } from '@/lib/server-auth';
import { revalidateProducts } from '@/lib/cache';

export async function POST(req: Request) {
    try {
        if (!(await isServerAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { productIds, storeLocation } = await req.json();

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ error: 'No products selected' }, { status: 400 });
        }

        if (storeLocation === undefined) {
            return NextResponse.json({ error: 'Store location is required' }, { status: 400 });
        }

        // Perform bulk update
        const result = await Product.updateMany(
            { _id: { $in: productIds } },
            { $set: { storeLocation, updatedAt: new Date() } }
        );

        // Invalidate cache
        revalidateProducts();

        // Audit Log
        const user = await getServerUser();
        if (user) {
            await AuditLog.create({
                adminId: user.id,
                action: 'BATCH_UPDATE_LOCATION',
                details: { 
                    productCount: result.modifiedCount, 
                    targetLocation: storeLocation,
                    productIds: productIds.slice(0, 10) // Log first 10 for reference
                }
            });
        }

        return NextResponse.json({ 
            message: `Successfully updated ${result.modifiedCount} products.`,
            modifiedCount: result.modifiedCount
        });

    } catch (error: any) {
        console.error('Batch Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
