import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Message from '@/models/Message';
import Product from '@/models/Product';
import User from '@/models/User';
import { isServerAdmin } from '@/lib/server-auth';

async function isAdmin() {
    return await isServerAdmin();
}

export async function GET() {
    try {
        await connectDB();
        const messages = await Message.find()
            .populate('productId', 'name price maxPrice')
            .sort({ createdAt: -1 });
        return NextResponse.json(messages);
    } catch (error: any) {
        console.error('API Error /api/admin/messages:', error.message);
        return NextResponse.json({ error: 'Failed to fetch messages', details: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await connectDB();
        await Message.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Message deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete message' }, { status: 400 });
    }
}
