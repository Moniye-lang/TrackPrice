import { NextResponse } from 'next/server';
import { scrapeProducts } from '@/lib/scraper';
import { matchScrapedProducts } from '@/lib/matcher';
import { isServerAdmin } from '@/lib/server-auth';

export async function POST(req: Request) {
    try {
        if (!(await isServerAdmin())) {
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
