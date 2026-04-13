import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Area from '@/models/Area';

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const state = searchParams.get('state');

        const query: any = { isActive: true };
        if (state) {
            query.state = state;
        }

        const areas = await Area.find(query).sort({ name: 1 });
        
        return NextResponse.json({ areas });
    } catch (error) {
        console.error('Failed to fetch areas:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
