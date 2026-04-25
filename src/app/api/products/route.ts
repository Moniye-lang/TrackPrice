import { NextResponse, NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Message from '@/models/Message';
import PriceUpdate from '@/models/PriceUpdate';
import Store from '@/models/Store';
import { parsePriceRange } from '@/lib/price-utils';
import { isServerAdmin } from '@/lib/server-auth';
import { escapeRegex } from '@/lib/utils';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS, revalidateProducts } from '@/lib/cache';

// Data fetching logic extracted for caching
const fetchProducts = async (params: {
    search: string | null;
    category: string | null;
    marketCategory: string | null;
    city: string | null;
    storeId: string | null;
    sort: string;
    featured: boolean;
    stale: boolean;
    page: string | null;
    limit: string | null;
    isAdmin: boolean;
}) => {
    const { search, category, marketCategory, city, storeId, sort, featured, stale, page: pageStr, limit: limitStr, isAdmin } = params;
    
    const conditions: any[] = [];
    
    let matchingStoreIds: any[] = [];
    if (search) {
        const words = search.trim().split(/\s+/).filter(Boolean);
        if (words.length > 0) {
            // Find stores that match any of the words (for location-based search)
            const storeSearchConditions = words.map((word: string) => {
                const lower = word.toLowerCase();
                const possibleCities = [word];
                if (lower.startsWith('iba')) possibleCities.push('Oyo');
                if (lower.startsWith('ike') || lower.startsWith('lek')) possibleCities.push('Lagos');

                return {
                    $or: [
                        { name: { $regex: `^${escapeRegex(word)}`, $options: 'i' } }, // Start of name
                        { name: { $regex: `\\s${escapeRegex(word)}`, $options: 'i' } }, // Start of word in name
                        { area: { $regex: `^${escapeRegex(word)}`, $options: 'i' } },
                        { city: { $regex: `^${escapeRegex(word)}`, $options: 'i' } },
                        { city: { $in: possibleCities.map(c => new RegExp(`^${escapeRegex(c)}`, 'i')) } }
                    ]
                };
            });
            const matchingStores = await Store.find({ $or: storeSearchConditions }).select('_id').lean();
            matchingStoreIds = matchingStores.map(s => s._id);

            // For every word typed, it must match at least one field (Name, Brand, Category, OR Location)
            const searchConditions = words.map((word: string) => ({
                $or: [
                    { name: { $regex: escapeRegex(word), $options: 'i' } },
                    { brand: { $regex: escapeRegex(word), $options: 'i' } },
                    { variant: { $regex: escapeRegex(word), $options: 'i' } },
                    { category: { $regex: escapeRegex(word), $options: 'i' } },
                    { storeLocation: { $regex: escapeRegex(word), $options: 'i' } },
                    { storeId: { $in: matchingStoreIds } }
                ]
            }));
            conditions.push({ $and: searchConditions });
        }
    }
    if (category && category !== 'All') {
        conditions.push({ category });
    }
    if (marketCategory && marketCategory !== 'All') {
        conditions.push({ marketCategory });
    }
    if (city && city !== 'All') {
        // Filter by city: find all stores in that city, then match products to those stores
        const storesInCity = await Store.find({ city: { $regex: escapeRegex(city), $options: 'i' } }).lean();
        const storeIds = storesInCity.map((s: any) => s._id);
        conditions.push({
            $or: [
                { storeId: { $in: storeIds } },
                { storeLocation: { $regex: escapeRegex(city), $options: 'i' } }
            ]
        });
    }
    if (storeId && storeId !== 'All') {
        try {
            const store = await Store.findById(storeId).lean();
            if (store) {
                conditions.push({
                    $or: [
                        { storeId: storeId },
                        { storeLocation: { $regex: escapeRegex(store.name), $options: 'i' } }
                    ]
                });
            } else {
                conditions.push({ storeId: storeId });
            }
        } catch (err) {
            conditions.push({ storeId: storeId });
        }
    }
    if (featured) {
        conditions.push({ isFeatured: true });
    }
    if (stale) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        
        conditions.push({
            $or: [
                { category: 'Oil and Gas', lastUpdated: { $lt: twoDaysAgo } },
                { category: { $ne: 'Oil and Gas' }, lastUpdated: { $lt: sevenDaysAgo } }
            ]
        });
    }

    // Status Filter: Non-admins only see approved products
    if (!isAdmin) {
        conditions.push({ 
            $or: [
                { status: 'approved' },
                { status: { $exists: false } }
            ]
        });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};

    let sortOption: any = {};
    if (sort === 'price_asc') sortOption.price = 1;
    else if (sort === 'price_desc') sortOption.price = -1;
    else if (sort === 'updated') sortOption.lastUpdated = -1;
    else sortOption.createdAt = -1;

    let queryChain = Product.find(query).populate('storeId').sort(sortOption);

    const isPaginated = pageStr && limitStr;
    let totalCount = 0;

    if (isPaginated) {
        const page = parseInt(pageStr, 10);
        const limit = parseInt(limitStr, 10);
        const skip = (page - 1) * limit;
        totalCount = await Product.countDocuments(query);
        queryChain = queryChain.skip(skip).limit(limit) as any;
    }

    let products = await queryChain.lean();
    let isFuzzyMatch = false;
    let suggestions: string[] = [];

    // "Did you mean?" / Fuzzy Fallback logic
    if (products.length === 0 && search) {
        console.log('[Products GET] No exact match, trying fuzzy/OR fallback...');
        const words = search.trim().split(/\s+/).filter(Boolean);
        if (words.length > 1) {
            // Try OR instead of AND
            const fallbackQuery = { ...query, $or: words.map(word => ({
                $or: [
                    { name: { $regex: escapeRegex(word), $options: 'i' } },
                    { brand: { $regex: escapeRegex(word), $options: 'i' } },
                    { variant: { $regex: escapeRegex(word), $options: 'i' } },
                    { category: { $regex: escapeRegex(word), $options: 'i' } },
                    { storeLocation: { $regex: escapeRegex(word), $options: 'i' } },
                    { storeId: { $in: matchingStoreIds } }
                ]
            })) };
            
            const fallbackResults = await Product.find(fallbackQuery).populate('storeId').sort(sortOption).limit(12).lean();
            if (fallbackResults.length > 0) {
                products = fallbackResults;
                isFuzzyMatch = true;
            }
        }
        
        // If still no results, or to provide spelling suggestions
        if (products.length === 0) {
            // Get some sample names for "Did you mean"
            const sampleProducts = await Product.find({ status: 'approved' }).select('name').limit(500).lean();
            const names = Array.from(new Set(sampleProducts.map(p => p.name)));
            // Simple suggestion: find names that contain parts of the search
            suggestions = names.filter(name => 
                words.some(word => name.toLowerCase().includes(word.toLowerCase()) || word.toLowerCase().includes(name.toLowerCase()))
            ).slice(0, 5);
        }
    }

    if (products.length === 0) {
        if (isPaginated) {
            return { products: [], currentPage: parseInt(pageStr!, 10), totalPages: 0, totalCount: 0, isFuzzyMatch, suggestions };
        }
        return { products: [], isFuzzyMatch, suggestions };
    }

    const productIds = products.map((p: any) => p._id);

    let countMap: Record<string, number> = {};
    try {
        const messageCounts = await Message.aggregate([
            { $match: { productId: { $in: productIds } } },
            { $group: { _id: '$productId', count: { $sum: 1 } } },
        ]);
        for (const item of messageCounts) {
            if (item._id) {
                countMap[item._id.toString()] = item.count;
            }
        }
    } catch (aggError) {}

    let pendingUpdateMap: Record<string, any> = {};
    try {
        const pendingUpdates = await PriceUpdate.find({
            productId: { $in: productIds },
            status: 'pending'
        }).sort({ createdAt: -1 }).lean();

        for (const update of pendingUpdates) {
            const pid = update.productId.toString();
            if (!pendingUpdateMap[pid]) {
                pendingUpdateMap[pid] = {
                    _id: update._id.toString(),
                    price: update.price,
                    maxPrice: update.maxPrice,
                    confirmationsCount: update.confirmations?.length || 0
                };
            }
        }
    } catch (pendingError) {}

    const productsWithCounts = products.map((p: any) => {
        let serializedStore = null;
        if (p.storeId) {
            if (p.storeId.name) {
                serializedStore = {
                    ...p.storeId,
                    _id: p.storeId._id.toString()
                };
            } else {
                serializedStore = p.storeId.toString();
            }
        }

        let priceStatus = 'stable';
        if (p.priceHistory && p.priceHistory.length >= 2) {
            const currentPrice = p.price;
            const previousPrice = p.priceHistory[p.priceHistory.length - 2].price;
            if (currentPrice < previousPrice) priceStatus = 'down';
            else if (currentPrice > previousPrice) priceStatus = 'up';
        }

        return {
            ...p,
            _id: p._id.toString(),
            storeId: serializedStore,
            messageCount: countMap[p._id.toString()] ?? 0,
            priceStatus,
            pendingUpdate: pendingUpdateMap[p._id.toString()] || null
        };
    });

    const finalProducts = sort === 'updated' 
        ? productsWithCounts.filter(p => p.priceStatus !== 'stable')
        : productsWithCounts;

    if (isPaginated) {
        const limit = parseInt(limitStr as string, 10);
        return {
            products: finalProducts,
            currentPage: parseInt(pageStr as string, 10),
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        };
    }

    return finalProducts;
};

// Create the cached version of fetchProducts
const getCachedProducts = unstable_cache(
    async (params: any) => {
        await connectDB();
        return fetchProducts(params);
    },
    ['products-list'],
    { 
        revalidate: 300, // 5 minutes background revalidation
        tags: [CACHE_TAGS.PRODUCTS] 
    }
);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const isAdmin = await isServerAdmin();
        const params = {
            search: searchParams.get('search'),
            category: searchParams.get('category'),
            marketCategory: searchParams.get('marketCategory'),
            city: searchParams.get('city'),
            storeId: searchParams.get('storeId'),
            sort: searchParams.get('sort') || 'newest',
            featured: searchParams.get('featured') === 'true',
            stale: searchParams.get('stale') === 'true',
            page: searchParams.get('page'),
            limit: searchParams.get('limit'),
            isAdmin
        };

        const result = await getCachedProducts(params);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[Products GET] Detailed Error:', error);
        return NextResponse.json({ error: 'Failed to fetch products', details: error.message }, { status: 500 });
    }
}

import { ProductSchema } from '@/lib/validation';

export async function POST(req: Request) {
    if (!(await isServerAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectDB();
        const rawBody = await req.json();
        console.log('[Products POST] Request body:', rawBody);

        const result = ProductSchema.safeParse(rawBody);
        if (!result.success) {
            console.error('[Products POST] Validation Error:', result.error.issues);
            return NextResponse.json({
                error: 'Validation failed',
                details: result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
            }, { status: 400 });
        }

        const body = { ...result.data, ...parsePriceRange(result.data.price) };
        const product = await Product.create(body);
        revalidateProducts(); // Invalidate cache
        console.log('[Products POST] Created product:', product._id);
        return NextResponse.json(product, { status: 201 });
    } catch (error: any) {
        console.error('[Products POST] Detailed Error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            issues: error.issues
        });
        return NextResponse.json({
            error: error.message || 'Failed to create product',
            details: error.name
        }, { status: 400 });
    }
}
