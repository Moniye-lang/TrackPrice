import { NextResponse } from 'next/server';
import { scrapeProducts } from '@/lib/scraper';
import { matchScrapedProducts } from '@/lib/matcher';
import { isServerAdmin } from '@/lib/server-auth';

export async function POST(req: Request) {
    try {
        if (!(await isServerAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let body;
        try {
            body = await req.json();
        } catch (e) {
            return NextResponse.json({ error: 'Missing or malformed request body. Expected JSON with "url".' }, { status: 400 });
        }

        const { url } = body;
        if (!url || typeof url !== 'string' || !url.startsWith('http')) {
            return NextResponse.json({ error: 'Invalid URL provided. Please enter a full URL (starting with http/https).' }, { status: 400 });
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
        const errorMessage = error.message || 'Internal Server Error';
        return NextResponse.json({ 
            error: errorMessage,
            details: error.stack?.split('\n').slice(0, 2).join(' ') // Provide a hint of where it crashed
        }, { status: 500 });
    }
}
