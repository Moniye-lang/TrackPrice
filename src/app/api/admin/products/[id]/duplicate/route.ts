import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { isServerAdmin, getServerUser } from '@/lib/server-auth';
import User from '@/models/User';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        if (!(await isServerAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const user = await getServerUser();
        const adminUser = await User.findById(user?.id);
        
        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const originalProduct = await Product.findById(id).lean();
        if (!originalProduct) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Create a new object without the internal fields
        const { _id, createdAt, updatedAt, __v, history, ...productData } = originalProduct as any;

        const duplicatedProduct = await Product.create({
            ...productData,
            name: `${productData.name} (Copy)`,
            reportCount: 0,
            flagged: false,
            updateRequested: false,
            priceHistory: [{
                price: productData.price,
                maxPrice: productData.maxPrice,
                verifiedAt: new Date()
            }],
            lastUpdated: new Date()
        });

        return NextResponse.json(duplicatedProduct, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
