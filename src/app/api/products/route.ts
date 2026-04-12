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
    storeId: string | null;
    sort: string;
    featured: boolean;
    stale: boolean;
    page: string | null;
    limit: string | null;
}) => {
    const { search, category, marketCategory, storeId, sort, featured, stale, page: pageStr, limit: limitStr } = params;
    
    const conditions: any[] = [];
    
    if (search) {
        const terms = search.split(',').map(t => t.trim()).filter(Boolean);
        if (terms.length > 1) {
            conditions.push({
                $or: terms.map(term => ({
                    name: { $regex: escapeRegex(term), $options: 'i' }
                }))
            });
        } else if (terms.length === 1) {
            conditions.push({ name: { $regex: escapeRegex(terms[0]), $options: 'i' } });
        }
    }
    if (category && category !== 'All') {
        conditions.push({ category });
    }
    if (marketCategory && marketCategory !== 'All') {
        conditions.push({ marketCategory });
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

    const products = await queryChain.lean();

    if (products.length === 0) {
        if (isPaginated) {
            return { products: [], currentPage: parseInt(pageStr!, 10), totalPages: 0, totalCount: 0 };
        }
        return [];
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
        const params = {
            search: searchParams.get('search'),
            category: searchParams.get('category'),
            marketCategory: searchParams.get('marketCategory'),
            storeId: searchParams.get('storeId'),
            sort: searchParams.get('sort') || 'newest',
            featured: searchParams.get('featured') === 'true',
            stale: searchParams.get('stale') === 'true',
            page: searchParams.get('page'),
            limit: searchParams.get('limit'),
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
