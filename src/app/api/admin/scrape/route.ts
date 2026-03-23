import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { scrapeProducts } from '@/lib/scraper';
import { matchScrapedProducts } from '@/lib/matcher';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

async function getAdminFromToken() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const decodedToken = await getAdminFromToken();
        if (!decodedToken || decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { url } = await req.json();
        if (!url || !url.startsWith('http')) {
            return NextResponse.json({ error: 'Invalid URL provided.' }, { status: 400 });
        }

        // Run scraper
        const scrapedData = await scrapeProducts(url);

        if (scrapedData.length === 0) {
            return NextResponse.json({ error: 'Extraction Failed: No products detected.' }, { status: 400 });
        }

        // Run matcher
        const matchedData = await matchScrapedProducts(scrapedData);

        return NextResponse.json({
            success: true,
            extractedCount: matchedData.length,
            data: matchedData
        });

    } catch (error: any) {
        console.error('Error in /api/admin/scrape:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
