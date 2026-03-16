import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Product from '@/models/Product';
import PriceUpdate from '@/models/PriceUpdate';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

async function getAdminFromToken() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;
    try {
        return verifyToken(token);
    } catch {
        return null;
    }
}

// GET all flagged products and pending updates for admin queue
export async function GET() {
    try {
        const decodedToken = await getAdminFromToken();
        if (!decodedToken || typeof (decodedToken as any).id !== 'string') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const adminUser = await User.findById((decodedToken as any).id);

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
