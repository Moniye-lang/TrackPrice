import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Product from '@/models/Product';
import { getServerSession } from '@/lib/server-auth';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const admin = await getServerSession(req);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const products = await Product.find({ isUserAdded: true }).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ products });
    } catch (error) {
        console.error('Fetch user products error:', error);
        return NextResponse.json({ error: 'Failed to fetch user products' }, { status: 500 });
    }
}
