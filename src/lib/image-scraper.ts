/**
 * findProductImage
 * Searches for a real product image using multiple strategies.
 *
 * Strategy 1: Open Food Facts API — free, no auth, great for packaged/grocery products
 * Strategy 2: Wikipedia REST API — good for branded items and well-known products
 * Strategy 3: Category-matched Unsplash photo — curated, always returns a real image
 */

// Curated Unsplash photo IDs by category — real, beautiful, royalty-free images
const CATEGORY_IMAGES: Record<string, string> = {
    'groceries':           'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
    'food':                'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
    'beverages':           'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80',
    'drinks':              'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80',
    'electronics':         'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
    'gadgets':             'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
    'clothing':            'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80',
    'fashion':             'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80',
    'home':                'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&q=80',
    'furniture':           'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
    'health & beauty':     'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80',
    'health':              'https://images.unsplash.com/photo-1477577835065-f6da9b76a97d?w=600&q=80',
    'beauty':              'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80',
    'books':               'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&q=80',
    'oil and gas':         'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&q=80',
    'fuel':                'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&q=80',
    'building materials':  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
    'construction':        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
    'meat':                'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80',
    'fish':                'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=600&q=80',
    'rice':                'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&q=80',
    'vegetables':          'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80',
    'fruits':              'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&q=80',
    'default':             'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
};

function getCategoryImage(category: string): string {
    const key = category.toLowerCase().trim();
    // Try exact match first
    if (CATEGORY_IMAGES[key]) return CATEGORY_IMAGES[key];
    // Try partial match
    for (const [cat, url] of Object.entries(CATEGORY_IMAGES)) {
        if (key.includes(cat) || cat.includes(key)) return url;
    }
    return CATEGORY_IMAGES['default'];
}

async function tryOpenFoodFacts(productName: string): Promise<string | null> {
    try {
        const encoded = encodeURIComponent(productName);
        const res = await fetch(
            `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encoded}&search_simple=1&action=process&json=1&page_size=3`,
            { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) return null;
        const data = await res.json();
        const products = data?.products || [];
        for (const p of products) {
            const img = p.image_url || p.image_front_url || p.image_front_thumb_url;
            if (img && img.startsWith('https://')) return img;
        }
        return null;
    } catch {
        return null;
    }
}

async function tryWikipedia(productName: string): Promise<string | null> {
    try {
        const encoded = encodeURIComponent(productName.replace(/\s+/g, '_'));
        const res = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
            { signal: AbortSignal.timeout(4000) }
        );
        if (!res.ok) return null;
        const data = await res.json();
        const img = data?.thumbnail?.source || data?.originalimage?.source;
        if (img && img.startsWith('https://')) return img;
        return null;
    } catch {
        return null;
    }
}

export async function findProductImage(
    productName: string,
    category?: string
): Promise<string | null> {
    // Strategy 1: Open Food Facts (best for food/grocery)
    const offImage = await tryOpenFoodFacts(productName);
    if (offImage) return offImage;

    // Strategy 2: Wikipedia (good for branded items)
    const wikiImage = await tryWikipedia(productName);
    if (wikiImage) return wikiImage;

    // Strategy 3: Category-matched curated Unsplash image — always works
    return getCategoryImage(category || 'groceries');
}
