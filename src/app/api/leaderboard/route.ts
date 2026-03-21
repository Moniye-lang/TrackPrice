import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');

    try {
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

        return NextResponse.json({
            users: topUsers,
            cities: topCities.map(c => c._id)
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}
