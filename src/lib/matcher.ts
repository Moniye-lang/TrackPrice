import Fuse from 'fuse.js';
import Product, { IProduct } from '@/models/Product';
import connectDB from '@/lib/db';

export interface MatchResult {
    name: string;
    price: number;
    matchedProductId: string | null;
    matchScore: number;
    matchedProductName?: string;
}

export async function matchScrapedProducts(scraped: { name: string, price: number }[]): Promise<MatchResult[]> {
    await connectDB();

    // Fetch products to match against
    const existingProducts = await Product.find({}, '_id name brand variant').lean() as any[];

    // Setup Fuse
    const fuse = new Fuse(existingProducts, {
        keys: ['name', 'brand', 'variant'],
        includeScore: true,
        threshold: 0.4, // lower is more strict
    });

    const results: MatchResult[] = [];

    for (const item of scraped) {
        const matches = fuse.search(item.name);

        if (matches.length > 0 && matches[0].score !== undefined && matches[0].score < 0.4) {
            const bestMatch = matches[0];
            results.push({
                name: item.name,
                price: item.price,
                matchedProductId: bestMatch.item._id!.toString(),
                matchedProductName: bestMatch.item.name,
                matchScore: bestMatch.score || 0,
            });
        } else {
            results.push({
                name: item.name,
                price: item.price,
                matchedProductId: null,
                matchScore: 0,
            });
        }
    }

    return results;
}
