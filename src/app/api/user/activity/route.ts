import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import PriceUpdate from '@/models/PriceUpdate';
import { verifyToken } from '@/lib/auth';

export async function GET() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload: any = verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Auth failed' }, { status: 401 });

    try {
        await connectDB();
        const activity = await PriceUpdate.find({ userId: payload.id })
            .populate('productId', 'name brand variant size')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        return NextResponse.json(activity);
    } catch (error: any) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}
