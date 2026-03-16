import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Product from '@/models/Product';
import PriceUpdate from '@/models/PriceUpdate';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

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

// GET analytics dashboard data
export async function GET() {
    try {
        const decodedToken = await getAdminFromToken();
        if (!decodedToken || typeof decodedToken.id !== 'string') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const adminUser = await User.findById(decodedToken.id);

        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        // 1. Top Products by update frequency
        const topProducts = await Product.find()
            .sort({ reportCount: -1 })
            .limit(5)
            .select('name reportCount price');

        // 2. High Dispute Products (Lots of reports but low confidence OR flagged)
        const disputeProducts = await Product.find({
            $or: [
                { flagged: true },
                { reportCount: { $gt: 5 }, confidenceLevel: 'Low' }
            ]
        }).limit(5).select('name price flagged confidenceLevel reportCount');

        // 3. Top Contributors
        const topContributors = await User.find({ role: 'user' })
            .sort({ points: -1 })
            .limit(5)
            .select('name email points reputationLevel');

        // 4. Confidence Level Distributions (for Pie Chart)
        const confidenceDist = await Product.aggregate([
            {
                $group: {
                    _id: '$confidenceLevel',
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedConfidenceDist = {
            High: 0, Medium: 0, Low: 0
        };
        confidenceDist.forEach(level => {
            if (level._id) formattedConfidenceDist[level._id as 'High' | 'Medium' | 'Low'] = level.count;
        });

        // 5. Overall System Stats
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalUpdates = await PriceUpdate.countDocuments();
        const pendingUpdates = await PriceUpdate.countDocuments({ status: 'pending' });

        return NextResponse.json({
            topProducts,
            disputeProducts,
            topContributors,
            confidenceDistribution: formattedConfidenceDist,
            stats: {
                totalUsers,
                totalProducts,
                totalUpdates,
                pendingUpdates
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
