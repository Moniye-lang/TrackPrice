import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import PriceUpdate from '@/models/PriceUpdate';
import { isServerAdmin, getServerUser } from '@/lib/server-auth';

// GET all users (Admin ONLY)
export async function GET() {
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

        // Aggregate to get submission counts along with user data
        const registeredUsers = await User.aggregate([
            {
                $lookup: {
                    from: 'priceupdates',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'submissions'
                }
            },
            {
                $addFields: {
                    totalSubmissions: { $size: '$submissions' },
                    isAnonymous: false
                }
            },
            {
                $project: {
                    submissions: 0,
                    password: 0
                }
            },
            { $sort: { points: -1 } }
        ]);

        // Aggregate unique anonymous users from PriceUpdates
        const anonymousUsers = await PriceUpdate.aggregate([
            { $match: { anonId: { $ne: null } } },
            {
                $group: {
                    _id: '$anonId',
                    totalSubmissions: { $sum: 1 },
                    lastSeen: { $max: '$createdAt' }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 'Guest Operator',
                    email: { $concat: ['ID: ', { $substr: ['$_id', 5, 8] }] }, // Mask the full UUID for privacy/UI
                    role: 'anonymous',
                    totalSubmissions: 1,
                    points: { $literal: 0 },
                    isAnonymous: { $literal: true },
                    createdAt: '$lastSeen'
                }
            }
        ]);

        return NextResponse.json([...registeredUsers, ...anonymousUsers]);

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
