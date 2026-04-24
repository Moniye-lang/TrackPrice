import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { isServerAdmin } from '@/lib/server-auth';

export async function POST() {
    try {
        if (!(await isServerAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Identify duplicates: Same name, same storeId (or storeLocation)
        // We group by these fields and find groups with count > 1
        const duplicates = await Product.aggregate([
            {
                $group: {
                    _id: {
                        name: "$name",
                        storeId: "$storeId",
                        storeLocation: "$storeLocation"
                    },
                    ids: { $push: "$_id" },
                    count: { $sum: 1 },
                    lastUpdated: { $max: "$updatedAt" }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);

        let totalDeleted = 0;

        for (const group of duplicates) {
            // Keep the one with the latest updatedAt
            // Find the id of the one to keep
            const latestProduct = await Product.findOne({
                _id: { $in: group.ids }
            }).sort({ updatedAt: -1 }).select('_id');

            if (latestProduct) {
                const idsToDelete = group.ids.filter((id: any) => id.toString() !== latestProduct._id.toString());
                const result = await Product.deleteMany({ _id: { $in: idsToDelete } });
                totalDeleted += result.deletedCount;
            }
        }

        return NextResponse.json({ 
            message: `Cleanup complete. Deleted ${totalDeleted} duplicate products.`,
            deletedCount: totalDeleted
        });

    } catch (error: any) {
        console.error('Delete Duplicates Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
