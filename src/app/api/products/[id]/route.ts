import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import PriceUpdate from '@/models/PriceUpdate';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { isValidObjectId } from '@/lib/db-utils';
import { isServerAdmin, getServerUser } from '@/lib/server-auth';
import { parsePriceRange } from '@/lib/price-utils';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS, revalidateProducts } from '@/lib/cache';

// Data fetching logic extracted for caching
const fetchProductDetail = async (productId: string) => {
    await connectDB();
    const product = await Product.findById(productId).lean();
    if (!product) return null;

    const suggestions = await PriceUpdate.find({
        productId,
        status: 'pending'
    })
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

    let priceStatus = 'stable';
    if (product.priceHistory && product.priceHistory.length >= 2) {
        const history = [...product.priceHistory].sort((a: any, b: any) => 
            new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
        );
        const current = history[0].price;
        const previous = history[1].price;
        if (current < previous) priceStatus = 'down';
        else if (current > previous) priceStatus = 'up';
    }

    return {
        ...product,
        _id: product._id?.toString() || productId,
        priceStatus,
        suggestions: (suggestions || []).map((s: any) => ({
            _id: s._id?.toString() || 'unknown',
            price: s.price,
            maxPrice: s.maxPrice,
            userName: s.userId?.name || 'Anonymous',
            vouchCount: s.anonymousConfirmations?.length || 0,
            createdAt: s.createdAt
        }))
    };
};

const getCachedProductDetail = (productId: string) => unstable_cache(
    () => fetchProductDetail(productId),
    [`product-detail-${productId}`],
    {
        revalidate: 300,
        tags: [CACHE_TAGS.PRODUCT_BY_ID(productId), CACHE_TAGS.PRODUCTS]
    }
)();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    let productId = 'unknown';
    try {
        const { id } = await params;
        productId = id;

        if (!isValidObjectId(productId)) {
            return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
        }

        const product = await getCachedProductDetail(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error: any) {
        console.error(`[Product ID GET] Detailed Error for ID ${productId}:`, error);

        if (error.name === 'CastError' || error.name === 'BSONError') {
            return NextResponse.json({ error: 'Invalid product ID format', details: error.message }, { status: 400 });
        }

        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

import { ProductSchema } from '@/lib/validation';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await isServerAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        await connectDB();
        const rawBody = await req.json();
        const body = ProductSchema.partial().parse(rawBody);

        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const updateData: any = { ...body };

        if (body.price !== undefined) {
            const parsed = parsePriceRange(body.price);
            updateData.price = parsed.price;
            updateData.maxPrice = parsed.maxPrice;

            if (updateData.price !== existingProduct.price || updateData.maxPrice !== existingProduct.maxPrice) {
                updateData.lastUpdated = new Date();
            }
        }

        const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
        
        revalidateProducts(id); // Invalidate specific product and list

        // Audit Log
        const user = await getServerUser();
        if (user) {
            await AuditLog.create({
                adminId: user.id,
                action: 'UPDATE_PRODUCT',
                details: { productId: id, changes: body }
            });
        }

        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: error.errors?.[0]?.message || 'Failed to update product' }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await isServerAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        await connectDB();
        await Product.findByIdAndDelete(id);
        
        revalidateProducts(id); // Invalidate specific product and list

        // Audit Log
        const user = await getServerUser();
        if (user) {
            await AuditLog.create({
                adminId: user.id,
                action: 'DELETE_PRODUCT',
                details: { productId: id }
            });
        }

        return NextResponse.json({ message: 'Product deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 400 });
    }
}
