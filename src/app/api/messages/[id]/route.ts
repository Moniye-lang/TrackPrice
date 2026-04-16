import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Message from '@/models/Message';
import { getServerUser, isServerAdmin } from '@/lib/server-auth';
import { cleanText } from '@/lib/profanity';
import { revalidateProducts } from '@/lib/cache';
import { cookies } from 'next/headers';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;

        const user = await getServerUser();
        const admin = await isServerAdmin();
        const cookieStore = await cookies();
        const anonId = cookieStore.get('anon_id')?.value;

        if (!user && !admin && !anonId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const message = await Message.findById(id);
        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        // Only the author or an admin can delete
        const isOwner = (user && message.userId?.toString() === user.id) || 
                        (!user && anonId && message.anonId === anonId);
        if (!isOwner && !admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await Message.findByIdAndDelete(id);

        if (message.productId) {
            revalidateProducts(message.productId.toString());
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;

        const user = await getServerUser();
        const admin = await isServerAdmin();
        const cookieStore = await cookies();
        const anonId = cookieStore.get('anon_id')?.value;

        if (!user && !admin && !anonId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const message = await Message.findById(id);
        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        // Only the author or an admin can edit
        const isOwner = (user && message.userId?.toString() === user.id) || 
                        (!user && anonId && message.anonId === anonId);
        if (!isOwner && !admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { content } = body;

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }
        if (content.length > 300) {
            return NextResponse.json({ error: 'Content exceeds 300 characters' }, { status: 400 });
        }

        const cleanedContent = cleanText(content.trim());
        message.content = cleanedContent;
        await message.save();

        return NextResponse.json(message);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }
}
