import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import ProductRequest from '@/models/ProductRequest';
import { verifyToken } from '@/lib/auth';

async function isAdmin() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return false;
    try {
        const payload: any = verifyToken(token);
        return payload?.role === 'admin';
    } catch (error) {
        return false;
    }
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
