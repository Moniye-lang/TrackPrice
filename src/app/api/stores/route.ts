import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Store from '@/models/Store';

export async function GET() {
    try {
        await connectDB();
        const stores = await Store.find({}).sort({ name: 1 });
        return NextResponse.json(stores);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
    }
}
