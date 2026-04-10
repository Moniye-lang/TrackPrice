import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import PriceUpdate from '@/models/PriceUpdate';
import { getServerUser } from '@/lib/server-auth';

export async function GET() {
    const user = await getServerUser();
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await connectDB();
        const activity = await PriceUpdate.find({ userId: user.id })
            .populate('productId', 'name brand variant size')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        return NextResponse.json(activity);
    } catch (error: any) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}
