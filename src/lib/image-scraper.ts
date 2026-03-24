/**
 * findProductImage
 * Searches for a product image using the product name.
 *
 * Strategy 1: Open Food Facts — free, no API key, great for grocery/consumer products.
 *             Searches by product name and returns the product's actual photo.
 *
 * Strategy 2: Wikipedia REST API — works for well-known branded products and ingredients.
 *
 * Strategy 3: placehold.co — always resolves, shows product name as text label.
 */
export async function findProductImage(productName: string): Promise<string | null> {
    const name = productName.trim();

    // --- Strategy 1: Open Food Facts product search ---
    try {
        const query = encodeURIComponent(name);
        const res = await fetch(
            `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&page_size=3`,
            { headers: { 'User-Agent': 'TrackPrice/1.0 (product-image-finder)' } }
        );
        if (res.ok) {
            const data = await res.json();
            const products = data?.products || [];
            for (const product of products) {
                const img = product.image_front_url || product.image_url || product.image_thumb_url;
                if (img && img.startsWith('http')) {
                    return img;
                }
            }
        }
    } catch (err) {
        console.warn(`Open Food Facts lookup failed for "${name}":`, err);
    }

    // --- Strategy 2: Wikipedia thumbnail ---
    try {
        const wikiTitle = encodeURIComponent(name.replace(/\s+/g, '_'));
        const wikiRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`,
            { headers: { 'User-Agent': 'TrackPrice/1.0 (product-image-finder)' } }
        );
        if (wikiRes.ok) {
            const wikiData = await wikiRes.json();
            const thumb = wikiData?.originalimage?.source || wikiData?.thumbnail?.source;
            if (thumb) return thumb;
        }
    } catch (err) {
        console.warn(`Wikipedia lookup failed for "${name}":`, err);
    }

    // --- Strategy 3: placehold.co text label (never 404s) ---
    return `https://placehold.co/400x400?text=${encodeURIComponent(name)}`;
}
