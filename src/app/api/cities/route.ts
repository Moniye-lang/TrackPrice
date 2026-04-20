import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Store from '@/models/Store';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        // Extract all unique cities from the Store collection
        const cities = await Store.distinct('city');
        // Filter out any empty values and sort them
        const filteredCities = cities.filter(Boolean).sort();
        return NextResponse.json(filteredCities);
    } catch (error) {
        console.error('API Cities ERROR:', error);
        return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 });
    }
}
