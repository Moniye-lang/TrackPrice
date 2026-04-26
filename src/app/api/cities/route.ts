import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Store from '@/models/Store';
import Message from '@/models/Message';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        // Extract all unique cities from the Store collection
        const cities = await Store.distinct('city');
        // Filter out any empty values and sort them
        const filteredCities = cities.filter(Boolean).sort();

        // Check for new messages in each city
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const cityData = await Promise.all(filteredCities.map(async (city) => {
            const hasNew = await Message.exists({ 
                city, 
                createdAt: { $gte: dayAgo } 
            });
            return { name: city, hasNew: !!hasNew };
        }));

        // Also check for "All Cities" (any message in last 24h)
        const hasAnyNew = await Message.exists({ 
            createdAt: { $gte: dayAgo } 
        });

        return NextResponse.json({
            cities: cityData,
            hasAnyNew: !!hasAnyNew
        });
    } catch (error) {
        console.error('API Cities ERROR:', error);
        return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 });
    }
}
