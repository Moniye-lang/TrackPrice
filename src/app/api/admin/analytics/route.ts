import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Product from '@/models/Product';
import PriceUpdate from '@/models/PriceUpdate';
import { isServerAdmin, getServerUser } from '@/lib/server-auth';

// GET analytics dashboard data
export async function GET() {
    try {
        if (!(await isServerAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await getServerUser();
        const userId = user?.id;

        await connectDB();
        const adminUser = await User.findById(userId);

        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        // 1. Top Products by update frequency
        const topProducts = await Product.find()
            .sort({ reportCount: -1 })
            .limit(5)
            .select('name reportCount price');

        // 2. High Dispute Products (Lots of reports OR flagged)
        const disputeProducts = await Product.find({
            $or: [
                { flagged: true },
                { reportCount: { $gt: 5 } }
            ]
        }).limit(5).select('name price flagged reportCount');

        // 3. Top Contributors
        const topContributors = await User.find({ role: 'user' })
            .sort({ points: -1 })
            .limit(5)
            .select('name email points reputationLevel');


        // 5. Price Conflicts (>50% difference from current price)
        const pendingUpdatesWithProducts = await PriceUpdate.find({ status: 'pending' })
            .populate('productId', 'name price')
            .sort({ createdAt: -1 })
            .limit(20);

        const priceConflicts = pendingUpdatesWithProducts.filter((update: any) => {
            if (!update.productId) return false;
            const currentPrice = update.productId.price;
            const newPrice = update.price;
            const diff = Math.abs(newPrice - currentPrice);
            return diff / currentPrice > 0.5;
        }).map((update: any) => ({
            _id: update._id,
            productName: update.productId.name,
            currentPrice: update.productId.price,
            proposedPrice: update.price,
            userId: update.userId,
            createdAt: update.createdAt
        }));

        // 6. Overall System Stats
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const totalUsers = await User.countDocuments();
        const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
        
        const totalProducts = await Product.countDocuments();
        const newProductsToday = await Product.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } });
        
        const totalUpdates = await PriceUpdate.countDocuments();
        const updatesToday = await PriceUpdate.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } });
        
        const pendingUpdates = await PriceUpdate.countDocuments({ status: 'pending' });

        return NextResponse.json({
            topProducts,
            disputeProducts,
            priceConflicts,
            topContributors,
            stats: {
                totalUsers,
                newUsersThisWeek,
                totalProducts,
                newProductsToday,
                totalUpdates,
                updatesToday,
                pendingUpdates
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
