import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { isValidObjectId } from '@/lib/utils';

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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    let productId = 'unknown';
    try {
        const { id } = await params;
        productId = id;

        if (!isValidObjectId(productId)) {
            console.log(`[Product ID GET] Invalid ID format: ${productId}`);
            return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
        }

        console.log(`[Product ID GET] Requested ID: ${productId}`);
        await connectDB();
        const product = await Product.findById(productId);
        if (!product) {
            console.log(`[Product ID GET] Product not found: ${productId}`);
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }
        return NextResponse.json(product);
    } catch (error) {
        console.error(`[Product ID GET] Error for ID ${productId}:`, error);
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 400 });
    }
}

import { ProductSchema } from '@/lib/validation';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await isAdmin())) {
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

        // Update lastUpdated only if price changes
        if (body.price !== undefined && body.price !== existingProduct.price) {
            updateData.lastUpdated = new Date();
        }

        const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: error.errors?.[0]?.message || 'Failed to update product' }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        await connectDB();
        await Product.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Product deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 400 });
    }
}
