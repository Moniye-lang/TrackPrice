import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Store from '@/models/Store';

export async function POST() {
    try {
        await connectDB();
        
        const products = await Product.find({});
        const stores = await Store.find({});
        
        let onlineCount = 0;
        let physicalCount = 0;
        let categoryUpdatedCount = 0;
        
        // Let's analyze keywords for Market Category
        const onlineKeywords = ['jumia', 'konga', 'online', 'website', 'app', 'delivery', 'glovo', 'chowdeck', 'supermarket']; // Some supermarkets might be physical, but usually scraped are online. Let's treat supermarkets as Physical unless they're known online aggregators.
        
        // Actually, let's treat Supermarket as Physical, and Jumia/Konga/Glovo as Online
        const strictOnline = ['jumia', 'konga', 'glovo', 'chowdeck', 'supermart', 'jiji'];
        
        for (const p of products) {
            let isOnline = false;
            
            // Check Store Reference first if exists
            if (p.storeId) {
                const store = stores.find(s => s._id.toString() === p.storeId?.toString());
                if (store && (store.type as string) === 'Online') {
                    isOnline = true;
                } else if (store && strictOnline.some(k => store.name.toLowerCase().includes(k))) {
                    isOnline = true;
                }
            }
            
            // Check storeLocation string
            if (!isOnline && p.storeLocation) {
                if (strictOnline.some(k => p.storeLocation!.toLowerCase().includes(k))) {
                    isOnline = true;
                }
            }
            
            p.marketCategory = isOnline ? 'Online' : 'Physical';
            
            // Auto Product Categorization logic (Basic keyword matching)
            const nameLower = p.name.toLowerCase();
            let newCat = p.category;
            
            if (p.category === 'All' || p.category === 'Other' || !p.category) {
                if (['iphone', 'samsung', 'laptop', 'tv', 'television', 'infinix', 'tecno', 'charger', 'usb'].some(k => nameLower.includes(k))) newCat = 'Electronics';
                else if (['rice', 'beans', 'garri', 'yam', 'egg', 'bread', 'oil', 'chicken', 'beef', 'fish', 'tomato', 'pepper', 'onion'].some(k => nameLower.includes(k))) newCat = 'Groceries';
                else if (['shirt', 'shoe', 'sneaker', 'dress', 'trouser', 'jeans', 'bag'].some(k => nameLower.includes(k))) newCat = 'Clothing';
                else if (['petrol', 'diesel', 'gas', 'pms', 'ago', 'lpg'].some(k => nameLower.includes(k))) newCat = 'Oil and Gas';
                else if (['book', 'pen', 'pencil', 'textbook', 'notebook'].some(k => nameLower.includes(k))) newCat = 'Books';
                else if (['chair', 'table', 'bed', 'mattress', 'generator'].some(k => nameLower.includes(k))) newCat = 'Home';
                
                if (newCat !== p.category) {
                    p.category = newCat;
                    categoryUpdatedCount++;
                }
            }
            
            if (p.marketCategory === 'Online') onlineCount++;
            else physicalCount++;
            
            await p.save();
        }
        
        return NextResponse.json({
            message: 'Auto-categorization complete.',
            totalProcessed: products.length,
            marketCategory: {
                online: onlineCount,
                physical: physicalCount
            },
            productCategoryUpdated: categoryUpdatedCount
        });
        
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
