import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import PriceUpdate from '@/models/PriceUpdate';
import Message from '@/models/Message';
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

export async function POST(req: Request) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectDB();
        const { sourceId, targetId } = await req.json();

        if (!sourceId || !targetId || sourceId === targetId) {
            return NextResponse.json({ error: 'Valid Source and Target IDs are required' }, { status: 400 });
        }

        const [source, target] = await Promise.all([
            Product.findById(sourceId),
            Product.findById(targetId)
        ]);

        if (!source || !target) {
            return NextResponse.json({ error: 'One or both products not found' }, { status: 404 });
        }

        // 1. Move Price Updates
        await PriceUpdate.updateMany({ productId: sourceId }, { productId: targetId });

        // 2. Move Messages
        await Message.updateMany({ productId: sourceId }, { productId: targetId });

        // 3. Delete Source Product
        await Product.findByIdAndDelete(sourceId);

        return NextResponse.json({
            message: `Successfully merged ${source.name} into ${target.name}. All updates and messages moved.`
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Merge failed' }, { status: 500 });
    }
}
