import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import Product from '@/models/Product';
import PriceUpdate from '@/models/PriceUpdate';
import { isServerAdmin, getServerUser } from '@/lib/server-auth';
import { revalidateProducts, revalidateLeaderboard } from '@/lib/cache';

// POST approve a price update forcefully
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

        const update = await PriceUpdate.findById(id).populate('productId');
        if (!update) {
            return NextResponse.json({ error: 'Price update not found' }, { status: 404 });
        }

        if (update.status !== 'pending') {
            return NextResponse.json({ error: 'Update is already ' + update.status }, { status: 400 });
        }

        const product = await Product.findById(update.productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Apply it over
        const oldPrice = product.price;
        const oldMaxPrice = product.maxPrice;
        product.price = update.price;
        product.maxPrice = update.maxPrice;
        product.priceHistory.push({ price: update.price, maxPrice: update.maxPrice, verifiedAt: new Date() });
        product.flagged = false;
        product.updateRequested = false;
        product.lastUpdated = new Date();
        await product.save();

        update.status = 'verified';
        await update.save();

        // Also resolve other pending updates around this new price
        const otherUpdates = await PriceUpdate.find({
            productId: product._id,
            status: 'pending',
            price: update.price
        });

        for (const ou of otherUpdates) {
            ou.status = 'verified';
            await ou.save();
        }

        // Log the action
        await AuditLog.create({
            adminId: adminUser._id,
            action: 'MANUAL_PRICE_APPROVAL',
            details: {
                updateId: update._id,
                productId: product._id,
                oldPrice: oldPrice,
                oldMaxPrice: oldMaxPrice,
                newPrice: update.price,
                newMaxPrice: update.maxPrice
            }
        });

        revalidateProducts(product._id.toString());
        revalidateLeaderboard();
        
        return NextResponse.json({ message: 'Price update manually approved successfully.' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
