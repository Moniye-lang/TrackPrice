import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PriceRequest from '@/models/PriceRequest';
import Product from '@/models/Product';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

async function getUserFromToken() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const { productId } = await req.json();

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        const decodedToken = await getUserFromToken();
        if (!decodedToken || typeof decodedToken.id !== 'string') {
            return NextResponse.json({ error: 'Authentication required to request a price update.' }, { status: 401 });
        }

        await connectDB();
        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const existingRequest = await PriceRequest.findOne({
            productId: product._id,
            status: 'open'
        });

        if (existingRequest) {
            return NextResponse.json({ error: 'There is already an open price request for this product.' }, { status: 409 });
        }

        const newRequest = new PriceRequest({
            productId: product._id,
            requesterId: decodedToken.id,
            status: 'open'
        });
        await newRequest.save();

        product.updateRequested = true;
        await product.save();

        return NextResponse.json({ message: 'Price update requested successfully', request: newRequest });

    } catch (error: any) {
        console.error('[Price Request] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
