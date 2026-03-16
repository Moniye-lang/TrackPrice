import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import PriceUpdate from '@/models/PriceUpdate';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

async function getAdminFromToken() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;
    try {
        return verifyToken(token);
    } catch {
        return null;
    }
}

// GET all users (Admin ONLY)
export async function GET() {
    try {
        const decodedToken = await getAdminFromToken();
        if (!decodedToken || typeof (decodedToken as any).id !== 'string') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const adminUser = await User.findById((decodedToken as any).id);

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
