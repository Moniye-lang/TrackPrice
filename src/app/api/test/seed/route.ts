import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Store from '@/models/Store';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST() {
    try {
        const token = (await cookies()).get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await User.findById((decoded as any).id);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        // 1. Create a few premium stores
        const stores = [
            { name: 'Shoprite', area: 'Ikeja Mall', city: 'Lagos', type: 'Supermarket', imageUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=800' },
            { name: 'Spar', area: 'Lekki Phase 1', city: 'Lagos', type: 'Supermarket', imageUrl: 'https://images.unsplash.com/photo-1604719312563-8912e9223c6a?auto=format&fit=crop&q=80&w=800' },
            { name: 'Balogun Market', area: 'Lagos Island', city: 'Lagos', type: 'Market', imageUrl: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=800' }
        ];

        const createdStores = [];
        for (const s of stores) {
            const existing = await Store.findOne({ name: s.name, area: s.area });
            if (!existing) {
                createdStores.push(await Store.create(s));
            } else {
                createdStores.push(existing);
            }
        }

        // 2. Create structured products
        const products = [
            {
                name: 'Instant Noodles',
                brand: 'Indomie',
                variant: 'Chicken Flavor',
                size: '70g x 40pcs',
                price: 12500,
                maxPrice: 13000,
                category: 'Groceries',
                storeId: createdStores[0]._id,
                imageUrl: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&q=80&w=800',
                confidenceLevel: 'High',
                reportCount: 25
            },
            {
                name: 'Refined Sugar',
                brand: 'Dangote',
                variant: 'Classic White',
                size: '50kg Bag',
                price: 85000,
                category: 'Groceries',
                storeId: createdStores[2]._id,
                imageUrl: 'https://images.unsplash.com/photo-1581441300259-4b87edddce73?auto=format&fit=crop&q=80&w=800',
                confidenceLevel: 'Medium',
                reportCount: 8
            },
            {
                name: 'Full Cream Milk',
                brand: 'Peak',
                variant: 'Evaporated',
                size: '160g Tin',
                price: 750,
                maxPrice: 850,
                category: 'Groceries',
                storeId: createdStores[1]._id,
                imageUrl: 'https://images.unsplash.com/photo-1550586671-f71ee15db01f?auto=format&fit=crop&q=80&w=800',
                confidenceLevel: 'High',
                reportCount: 42
            }
        ];

        let createdCount = 0;
        for (const p of products) {
            const existing = await Product.findOne({ name: p.name, brand: p.brand, variant: p.variant });
            if (!existing) {
                await Product.create(p);
                createdCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Seeded ${createdStores.length} stores and ${createdCount} new structured products.`,
            stores: createdStores.length,
            products: createdCount
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
