import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET() {
    try {
        await connectDB();

        // Fetch top 100 users by points
        const topUsers = await User.find({ points: { $gt: 0 } })
            .select('-password -email -role -__v -rewardedUpdatesToday -lastRewardedDate')
            .sort({ points: -1 })
            .limit(100);

        return NextResponse.json({ users: topUsers });

    } catch (error: any) {
        console.error('[Leaderboard] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
