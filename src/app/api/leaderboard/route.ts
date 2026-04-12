import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache';

const getCachedLeaderboard = unstable_cache(
    async (city: string | null) => {
        await connectDB();

        const query: any = { role: 'user', isBanned: false };
        if (city) {
            query.city = { $regex: new RegExp(city, 'i') };
        }

        const topUsers = await User.find(query)
            .sort({ points: -1 })
            .limit(50)
            .select('name points reputationLevel city createdAt')
            .lean();

        // Get top cities (for the filter dropdown)
        const topCities = await User.aggregate([
            { $match: { city: { $exists: true, $ne: '' } } },
            { $group: { _id: '$city', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        return {
            users: topUsers,
            cities: topCities.map(c => c._id)
        };
    },
    ['leaderboard-cache'],
    {
        revalidate: 300, // 5 minutes
        tags: [CACHE_TAGS.LEADERBOARD]
    }
);

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');

    try {
        const result = await getCachedLeaderboard(city);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}
