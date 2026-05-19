import { NextResponse } from 'next/server';
import { isServerAdmin } from '@/lib/server-auth';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { cleanAndNormalizeImageUrl } from '@/lib/scraper';

export async function POST() {
    try {
        if (!(await isServerAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Retrieve all products
        const products = await Product.find({});
        let updatedCount = 0;

        for (const product of products) {
            const originalUrl = product.imageUrl || '';
            let cleanedUrl = cleanAndNormalizeImageUrl(originalUrl, '');

            // Also check for duplicate/concatenated hostnames: e.g. https://trackpricely.com/https://... or similar
            if (cleanedUrl.includes('trackpricely.com/http')) {
                const idx = cleanedUrl.indexOf('trackpricely.com/');
                const remaining = cleanedUrl.substring(idx + 'trackpricely.com/'.length);
                if (remaining.startsWith('http')) {
                    cleanedUrl = remaining;
                }
            }

            if (cleanedUrl !== originalUrl) {
                product.imageUrl = cleanedUrl;
                await product.save();
                updatedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Migration complete. Checked ${products.length} products.`,
            updatedCount
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
