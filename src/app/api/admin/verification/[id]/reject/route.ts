import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import Product from '@/models/Product';
import PriceUpdate from '@/models/PriceUpdate';
import { isServerAdmin, getServerUser } from '@/lib/server-auth';

// POST reject a price update forcefully
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        if (!(await isServerAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const user = await getServerUser();
        const adminUser = await User.findById(user?.id);

        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        const { id } = await params;

        const update = await PriceUpdate.findById(id);
        if (!update) {
            return NextResponse.json({ error: 'Price update not found' }, { status: 404 });
        }

        if (update.status !== 'pending') {
            return NextResponse.json({ error: 'Update is already ' + update.status }, { status: 400 });
        }

        update.status = 'rejected';
        await update.save();

        // Check if we can unflag the product (if no massive pendings exist)
        const product = await Product.findById(update.productId);
        if (product && product.flagged) {
            // Check if there are other crazy pending updates
            const otherPendings = await PriceUpdate.find({ productId: product._id, status: 'pending' });
            if (otherPendings.length === 0) {
                product.flagged = false;
                await product.save();
            }
        }

        // Log the action
        await AuditLog.create({
            adminId: adminUser._id,
            action: 'MANUAL_PRICE_REJECTION',
            details: {
                updateId: update._id,
                productId: update.productId,
                rejectedPrice: update.price
            }
        });

        return NextResponse.json({ message: 'Price update manually rejected.' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
