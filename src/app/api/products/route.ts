import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { escapeRegex } from '@/lib/utils';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

async function isAdmin() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return false;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload.role === 'admin';
    } catch (error) {
        return false;
    }
}

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');
        const category = searchParams.get('category');
        const sort = searchParams.get('sort') || 'newest';

        console.log(`[Products GET] search=${search}, category=${category}, sort=${sort}`);

        let query: any = {};
        if (search) {
            query.name = { $regex: escapeRegex(search), $options: 'i' };
        }
        if (category && category !== 'All') {
            query.category = category;
        }

        let sortOption: any = {};
        if (sort === 'price_asc') sortOption.price = 1;
        else if (sort === 'price_desc') sortOption.price = -1;
        else if (sort === 'updated') sortOption.lastUpdated = -1;
        else sortOption.createdAt = -1;

        const products = await Product.find(query).sort(sortOption);
        console.log(`[Products GET] Found ${products.length} products`);
        return NextResponse.json(products);
    } catch (error: any) {
        console.error('[Products GET] error:', error);

        // Return 400 for Mongoose CastError or Query errors
        if (error.name === 'CastError' || error.name === 'ValidationError') {
            return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
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
        const body = ProductSchema.parse(rawBody);
        const product = await Product.create(body);
        console.log('[Products POST] Created product:', product._id);
        return NextResponse.json(product, { status: 201 });
    } catch (error: any) {
        console.error('[Products POST] error:', error);
        return NextResponse.json({ error: error.errors?.[0]?.message || 'Failed to create product' }, { status: 400 });
    }
}
