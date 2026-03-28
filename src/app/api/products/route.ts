import { NextResponse, NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Message from '@/models/Message';
import PriceUpdate from '@/models/PriceUpdate';
import Store from '@/models/Store'; // Explicitly import for population
import { parsePriceRange } from '@/lib/price-utils';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { escapeRegex } from '@/lib/utils';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

async function isAdmin() {
    const token = (await cookies()).get('token')?.value;
    if (!token) {
        console.log('[isAdmin] No token found in cookies');
        return false;
    }
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role !== 'admin') {
            console.log(`[isAdmin] Role mismatch: ${payload.role}`);
            return false;
        }
        return true;
    } catch (error: any) {
        console.log(`[isAdmin] JWT Verification failed: ${error.message}`);
        return false;
    }
}

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = req.nextUrl;
        const search = searchParams.get('search');
        const category = searchParams.get('category');
        const sort = searchParams.get('sort') || 'newest';
        const storeId = searchParams.get('storeId');
        const featured = searchParams.get('featured') === 'true';
        const stale = searchParams.get('stale') === 'true';

        console.log(`[Products GET] Processing with search=${search}, category=${category}, storeId=${storeId}, sort=${sort}, featured=${featured}, stale=${stale}`);

        const conditions: any[] = [];
        
        if (search) {
            conditions.push({ name: { $regex: escapeRegex(search), $options: 'i' } });
        }
        if (category && category !== 'All') {
            conditions.push({ category });
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
                    console.log(`[Products GET] Expanding query for store: ${store.name}`);
                } else {
                    conditions.push({ storeId: storeId });
                }
            } catch (err) {
                console.error('[Products GET] Store Lookup Error:', err);
                conditions.push({ storeId: storeId });
            }
        }
        if (featured) {
            conditions.push({ isFeatured: true });
        }
        if (stale) {
            // Stale = not updated in 7 days for most, 2 days for Oil and Gas
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

        const products = await Product.find(query)
            .populate('storeId')
            .sort(sortOption)
            .lean(); // Faster, plain objects

        console.log(`[Products GET] Found ${products.length} products`);

        if (products.length === 0) {
            return NextResponse.json([]);
        }

        // Aggregate message counts
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
        } catch (aggError) {
            console.error('[Products GET] Aggregation Error:', aggError);
        }

        // Fetch most recent pending updates for these products
        let pendingUpdateMap: Record<string, any> = {};
        try {
            const pendingUpdates = await PriceUpdate.find({
                productId: { $in: productIds },
                status: 'pending'
            }).sort({ createdAt: -1 }).lean();

            // We only need the most recent one per product
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
        } catch (pendingError) {
            console.error('[Products GET] Pending Update Fetch Error:', pendingError);
        }

        const productsWithCounts = products.map((p: any) => {
            // Safely handle storeId whether it's populated or not
            let serializedStore = null;
            if (p.storeId) {
                if (p.storeId.name) {
                    // It's populated
                    serializedStore = {
                        ...p.storeId,
                        _id: p.storeId._id.toString()
                    };
                } else {
                    // It's just an ID
                    serializedStore = p.storeId.toString();
                }
            }

            // Calculate price status based on history
            let priceStatus = 'stable';
            if (p.priceHistory && p.priceHistory.length >= 2) {
                // The last element is the current price (just pushed), 
                // the second to last is the previous one.
                const currentPrice = p.price;
                const previousPrice = p.priceHistory[p.priceHistory.length - 2].price;
                if (currentPrice < previousPrice) priceStatus = 'down';
                else if (currentPrice > previousPrice) priceStatus = 'up';
            } else if (p.priceHistory && p.priceHistory.length === 1 && p.createdAt) {
                // If only one history entry, we could compare with some initial value if it existed,
                // but usually stable is fine for the very first entry.
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

        return NextResponse.json(productsWithCounts);
    } catch (error: any) {
        console.error('[Products GET] Detailed Error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            query: error.query
        });

        // Return 400 for Mongoose CastError or Query errors
        if (error.name === 'CastError' || error.name === 'ValidationError' || error.name === 'BSONError') {
            return NextResponse.json({
                error: 'Invalid query parameters',
                details: error.message
            }, { status: 400 });
        }

        return NextResponse.json({ error: 'Failed to fetch products', details: error.message }, { status: 500 });
    }
}

import { ProductSchema } from '@/lib/validation';

export async function POST(req: Request) {
    if (!(await isAdmin())) {
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
