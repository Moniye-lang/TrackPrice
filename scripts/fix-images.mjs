/**
 * fix-images.mjs
 * Replaces all placehold.co / missing image URLs with real images.
 * Run with: node --env-file=.env.local scripts/fix-images.mjs
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set. Run: node --env-file=.env.local scripts/fix-images.mjs');
    process.exit(1);
}

const ProductSchema = new mongoose.Schema({
    name:      { type: String },
    category:  { type: String },
    imageUrl:  { type: String },
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// Category → curated Unsplash image (all already allowed in next.config.ts)
const CATEGORY_IMAGES = {
    'groceries':          'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
    'beverages':          'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80',
    'electronics':        'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
    'clothing':           'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80',
    'home':               'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&q=80',
    'health & beauty':    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80',
    'books':              'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&q=80',
    'oil and gas':        'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&q=80',
    'building materials': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
    'default':            'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
};

function getCategoryImage(category = '') {
    const key = category.toLowerCase().trim();
    if (CATEGORY_IMAGES[key]) return CATEGORY_IMAGES[key];
    for (const [cat, url] of Object.entries(CATEGORY_IMAGES)) {
        if (key.includes(cat) || cat.includes(key)) return url;
    }
    return CATEGORY_IMAGES['default'];
}

async function tryOpenFoodFacts(name) {
    try {
        const res = await fetch(
            `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(name)}&search_simple=1&action=process&json=1&page_size=3`,
            { signal: AbortSignal.timeout(6000) }
        );
        if (!res.ok) return null;
        const data = await res.json();
        for (const p of (data.products || [])) {
            const img = p.image_url || p.image_front_url;
            if (img && img.startsWith('https://')) return img;
        }
    } catch {}
    return null;
}

async function getImage(name, category) {
    // Try Open Food Facts for food categories
    const foodCategories = ['groceries', 'beverages', 'food', 'health'];
    const isFoodLike = foodCategories.some(f => (category || '').toLowerCase().includes(f));
    if (isFoodLike) {
        const img = await tryOpenFoodFacts(name);
        if (img) return img;
    }
    // Always fall back to curated Unsplash
    return getCategoryImage(category);
}

async function run() {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const products = await Product.find({
        $or: [
            { imageUrl: { $regex: 'placehold\.co', $options: 'i' } },
            { imageUrl: null },
            { imageUrl: '' },
            { imageUrl: '/placeholder-product.jpg' },
        ]
    });

    console.log(`📦 Found ${products.length} products needing image updates\n`);

    if (products.length === 0) {
        console.log('✨ All products already have real images!');
        await mongoose.disconnect();
        return;
    }

    let updated = 0;
    for (const product of products) {
        const newUrl = await getImage(product.name, product.category);
        product.imageUrl = newUrl;
        await product.save();
        updated++;
        console.log(`  ✓ [${updated}/${products.length}] ${product.name} → ${newUrl.substring(0, 60)}...`);
    }

    console.log(`\n🎉 Done! Updated ${updated} products with real images.`);
    await mongoose.disconnect();
}

run().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
