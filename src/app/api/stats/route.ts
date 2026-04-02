import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Store from '@/models/Store';

export async function GET() {
    try {
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
        if (lastProduct) {
            const latest = new Date(lastProduct.lastUpdated);
            const now = new Date();
            lastUpdateMins = Math.floor((now.getTime() - latest.getTime()) / (1000 * 60));
        }

        return NextResponse.json({
            updatesToday,
            marketsTracked,
            lastUpdateMins: Math.max(0, lastUpdateMins)
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
