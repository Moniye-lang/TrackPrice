import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import Product from '@/models/Product';
import User from '@/models/User';
import Message from '@/models/Message';
import { isServerAdmin } from '@/lib/server-auth';

async function checkAdmin() {
    return await isServerAdmin();
}

export async function GET() {
    try {
        await connectDB();
        
        // Ensure models are registered even if not explicitly used in this line
        // sometimes necessary for Mongoose population in some environments
        if (!mongoose.models.Product) mongoose.model('Product');
        if (!mongoose.models.User) mongoose.model('User');

        const messages = await Message.find()
            .populate({
                path: 'productId',
                select: 'name price maxPrice',
                model: Product // Explicitly pass model
            })
            .sort({ createdAt: -1 });
            
        return NextResponse.json(messages);
    } catch (error: any) {
        console.error('CRITICAL: /api/admin/messages GET failure:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch messages', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    if (!(await checkAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        
        let idsToDelete: string[] = [];
        
        if (id) {
            idsToDelete = [id];
        } else {
            const body = await req.json();
            idsToDelete = body.ids;
        }

        if (!idsToDelete || !Array.isArray(idsToDelete) || idsToDelete.length === 0) {
            return NextResponse.json({ error: 'IDs required' }, { status: 400 });
        }

        await connectDB();
        await Message.deleteMany({ _id: { $in: idsToDelete } });
        return NextResponse.json({ message: `${idsToDelete.length} messages deleted successfully` });
    } catch (error: any) {
        console.error('DELETE /api/admin/messages error:', error);
        return NextResponse.json({ error: 'Failed to delete messages', details: error.message }, { status: 400 });
    }
}
