import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { getServerUser } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, category, price, imageUrl, storeLocation } = body;

        if (!name || !category || !price) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newProduct = new Product({
            name,
            category,
            price: Number(price),
            imageUrl: imageUrl || 'https://placehold.co/400x400/png?text=No+Image',
            storeLocation: storeLocation || 'User Added',
            isUserAdded: true, // Mark as user added
            lastUpdatedBy: user.name,
            priceHistory: [{
                price: Number(price),
                verifiedAt: new Date()
            }]
        });

        await newProduct.save();

        return NextResponse.json({ message: 'Product added successfully', product: newProduct }, { status: 201 });
    } catch (error: any) {
        console.error('Add product error:', error);
        return NextResponse.json({ error: 'Failed to add product' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const admin = await getServerUser();
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { productIds } = body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ error: 'No product IDs provided' }, { status: 400 });
        }

        const result = await Product.deleteMany({ _id: { $in: productIds }, isUserAdded: true });
        return NextResponse.json({ message: `Deleted ${result.deletedCount} user-added products` });
    } catch (error) {
        console.error('Mass delete error:', error);
        return NextResponse.json({ error: 'Failed to mass delete products' }, { status: 500 });
    }
}
