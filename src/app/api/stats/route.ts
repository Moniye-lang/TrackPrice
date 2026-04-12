import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Store from '@/models/Store';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache';

const getCachedStats = unstable_cache(
    async () => {
        await connectDB();
        
        // 1. Updates Today (within the last 24 hours)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const updatesToday = await Product.countDocuments({
            lastUpdated: { $gte: dayAgo }
        });
        
        // 2. Markets Tracked
        const marketsTracked = await Store.countDocuments();
        
        // 3. Last Update Mins
        const lastProduct = await Product.findOne({})
            .sort({ lastUpdated: -1 })
            .select('lastUpdated');
        
        let lastUpdateMins = 0;
        let latestTimestamp = Date.now();
        if (lastProduct) {
            latestTimestamp = new Date(lastProduct.lastUpdated).getTime();
        }

        return {
            updatesToday,
            marketsTracked,
            latestTimestamp
        };
    },
    ['stats-summary'],
    {
        revalidate: 120, // 2 minutes
        tags: [CACHE_TAGS.STATS]
    }
);

export async function GET() {
    try {
        const stats = await getCachedStats();
        
        // Dynamic part: calculate mins since latestTimestamp
        const now = Date.now();
        const lastUpdateMins = Math.floor((now - stats.latestTimestamp) / (1000 * 60));

        return NextResponse.json({
            updatesToday: stats.updatesToday,
            marketsTracked: stats.marketsTracked,
            lastUpdateMins: Math.max(0, lastUpdateMins)
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
