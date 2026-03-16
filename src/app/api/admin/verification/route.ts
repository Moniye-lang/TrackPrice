import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Product from '@/models/Product';
import PriceUpdate from '@/models/PriceUpdate';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

async function getAdminFromToken() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch {
        return null;
    }
}

// GET all flagged products and pending updates for admin queue
export async function GET() {
    try {
        const decodedToken = await getAdminFromToken();
        if (!decodedToken || typeof decodedToken.id !== 'string') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const adminUser = await User.findById(decodedToken.id);

        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        // Fetch all products that are flagged
        const flaggedProducts = await Product.find({ flagged: true });

        // Fetch all pending price updates
        const pendingUpdates = await PriceUpdate.find({ status: 'pending' })
            .populate('productId', 'name price imageUrl category flagged')
            .populate('userId', 'name email reputationLevel points isBanned')
            .sort({ createdAt: -1 });

        return NextResponse.json({
            flaggedProducts,
            pendingUpdates
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
