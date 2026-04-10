import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import ProductRequest from '@/models/ProductRequest';
import { isServerAdmin } from '@/lib/server-auth';

async function isAdmin() {
    return await isServerAdmin();
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        if (!status || !['approved', 'denied'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        await connectDB();
        const request = await ProductRequest.findByIdAndUpdate(id, { status }, { new: true });

        if (!request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        return NextResponse.json({ message: `Request ${status} successfully`, request });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
    }
}
