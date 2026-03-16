import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
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

// GET all users (Admin ONLY)
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
