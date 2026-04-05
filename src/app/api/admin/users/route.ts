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
        const users = await User.aggregate([
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
                    totalSubmissions: { $size: '$submissions' }
                }
            },
            {
                $project: {
                    submissions: 0,
                    password: 0 // Never return passwords
                }
            },
            { $sort: { points: -1 } }
        ]);

        return NextResponse.json(users);

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
