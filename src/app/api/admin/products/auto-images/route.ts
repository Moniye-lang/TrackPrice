import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { findProductImage } from '@/lib/image-scraper';

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

export async function POST() {
    try {
        const decodedToken = await getAdminFromToken();
        if (!decodedToken || decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Find products with local, placehold.co, loremflickr, or missing images
        const productsWithoutImages = await Product.find({
            $or: [
                { imageUrl: '/placeholder-product.jpg' },
                { imageUrl: { $regex: '^https://placehold\\.co' } },
                { imageUrl: { $regex: '^https://loremflickr\\.com' } },
                { imageUrl: null },
                { imageUrl: '' }
            ]
        });

        if (productsWithoutImages.length === 0) {
            return NextResponse.json({ success: true, message: 'All products already have real images.', updatedCount: 0 });
        }

        let updatedCount = 0;
        let failedCount = 0;
        const results: { name: string; status: string; imageUrl?: string }[] = [];

        for (const product of productsWithoutImages) {
            const newImageUrl = await findProductImage(product.name);
            if (newImageUrl) {
                product.imageUrl = newImageUrl;
                await product.save();
                updatedCount++;
                results.push({ name: product.name, status: 'updated', imageUrl: newImageUrl });
            } else {
                failedCount++;
                results.push({ name: product.name, status: 'failed' });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Updated ${updatedCount} of ${productsWithoutImages.length} products. (${failedCount} failed)`,
            updatedCount,
            results
        });

    } catch (error: any) {
        console.error('Error in /api/admin/products/auto-images:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
