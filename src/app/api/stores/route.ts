import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Store from '@/models/Store';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache';

const getCachedStores = unstable_cache(
    async () => {
        await connectDB();
        return await Store.find({}).sort({ name: 1 }).lean();
    },
    ['stores-list'],
    {
        revalidate: 3600, // 1 hour (stores change rarely)
        tags: [CACHE_TAGS.STORES]
    }
);

export async function GET() {
    try {
        const stores = await getCachedStores();
        return NextResponse.json(stores);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
    }
}
