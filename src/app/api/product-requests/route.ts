import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import ProductRequest from '@/models/ProductRequest';
import { getServerUser } from '@/lib/server-auth';

async function getAuthUser() {
    return await getServerUser();
}

// POST to create a product request (User)
export async function POST(req: Request) {
    const userPayload = await getAuthUser();
    if (!userPayload) {
        return NextResponse.json({ error: 'Log in to suggest products' }, { status: 401 });
    }

    try {
        await connectDB();
        const body = await req.json();

        const { name, category, brand, variant, size } = body;
        if (!name || !category) {
            return NextResponse.json({ error: 'Name and Category are required' }, { status: 400 });
        }

        const request = await ProductRequest.create({
            name,
            category,
            brand,
            variant,
            size,
            userId: (userPayload as any).id,
            status: 'pending'
        });

        return NextResponse.json({ message: 'Product request submitted!', request });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Submission failed' }, { status: 500 });
    }
}

// GET all requests (Admin)
export async function GET(req: Request) {
    const userPayload: any = await getAuthUser();
    if (!userPayload || userPayload.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectDB();
        const requests = await ProductRequest.find()
            .populate('userId', 'name email points')
            .sort({ createdAt: -1 });
        return NextResponse.json(requests);
    } catch (error: any) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}
