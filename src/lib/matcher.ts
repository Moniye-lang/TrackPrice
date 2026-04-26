import Fuse from 'fuse.js';
import Product, { IProduct } from '@/models/Product';
import connectDB from '@/lib/db';

export interface MatchResult {
    name: string;
    price: number;
    category?: string;
    matchedProductId: string | null;
    matchScore: number;
    matchedProductName?: string;
}

export async function matchScrapedProducts(scraped: { name: string, price: number, category?: string }[], location?: string, marketCategory?: string): Promise<MatchResult[]> {
    await connectDB();

    // Fetch products to match against, filtering by location and category if provided
    let query: Record<string, any> = {};
    
    if (marketCategory === 'Physical') {
        // Apply location filtering for Physical products
        if (location && location.trim()) {
            query.storeLocation = { $regex: location.trim(), $options: 'i' };
        }

        // Physical search includes products explicitly marked Physical OR legacy products with no category
        query.$or = [
            { marketCategory: 'Physical' },
            { marketCategory: { $exists: false } },
            { marketCategory: null }
        ];
    } else if (marketCategory === 'Online') {
        // Online search is strict and IGNORES location (Online is global)
        query.marketCategory = 'Online';
    }

    const existingProducts = await Product.find(query, '_id name brand variant storeLocation marketCategory').lean() as any[];

    // If no local products found and location was provided, we might want to return 
    // nothing to avoid cross-location matches. However, to be safe, if we find nothing locally,
    // we just won't have any candidates for Fuse.
    
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
                category: item.category,
                matchedProductId: bestMatch.item._id!.toString(),
                matchedProductName: bestMatch.item.name,
                matchScore: bestMatch.score || 0,
            });
        } else {
            results.push({
                name: item.name,
                price: item.price,
                category: item.category,
                matchedProductId: null,
                matchScore: 0,
            });
        }
    }

    return results;
}
