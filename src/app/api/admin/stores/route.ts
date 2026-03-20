import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Store from '@/models/Store';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

async function isAdmin() {
    const token = (await cookies()).get('admin_token')?.value;
    if (!token) return false;
    const decoded = verifyToken(token);
    return !!decoded && (decoded as any).role === 'admin';
}

export async function GET() {
    try {
        await connectDB();
        const stores = await Store.find().sort({ name: 1 });
        return NextResponse.json(stores);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectDB();
        const body = await req.json();
        const { name, area, city, type, imageUrl } = body;

        if (!name || !area || !city) {
            return NextResponse.json({ error: 'Name, area, and city are required' }, { status: 400 });
        }

        const store = await Store.create({ name, area, city, type, imageUrl });
        return NextResponse.json(store, { status: 201 });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: 'A store with this name already exists in this area.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectDB();
        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) return NextResponse.json({ error: 'Store ID required' }, { status: 400 });

        const store = await Store.findByIdAndUpdate(id, updateData, { new: true });
        return NextResponse.json(store);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Store ID required' }, { status: 400 });

        await Store.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Store deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 });
    }
}
