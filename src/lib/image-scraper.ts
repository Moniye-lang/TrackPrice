/**
 * findProductImage
 * Searches for a product image using the product name.
 *
 * Strategy 1: Supermart.ng — Nigerian online grocery store, most relevant for local products.
 *             Fetches search results and extracts the first product image from the page.
 *
 * Strategy 2: Open Food Facts — free, no API key, great for packaged/branded food products.
 *
 * Strategy 3: Wikipedia REST API — works for well-known branded products and ingredients.
 *
 * Strategy 4: placehold.co — always resolves, shows product name as text label.
 */
export async function findProductImage(productName: string): Promise<string | null> {
    const name = productName.trim();

    // --- Strategy 1: Supermart.ng search ---
    try {
        const query = encodeURIComponent(name);
        const res = await fetch(
            `https://supermart.ng/search?q=${query}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            }
        );
        if (res.ok) {
            const html = await res.text();

            // Supermart.ng is a Next.js app — product data is embedded in __NEXT_DATA__
            const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
            if (nextDataMatch) {
                try {
                    const nextData = JSON.parse(nextDataMatch[1]);
                    // Navigate to search results products array
                    const products =
                        nextData?.props?.pageProps?.searchResults?.products ||
                        nextData?.props?.pageProps?.products ||
                        [];
                    for (const p of products) {
                        const img = p?.image || p?.imageUrl || p?.images?.[0];
                        if (img && typeof img === 'string' && img.startsWith('http')) {
                            return img;
                        }
                    }
                } catch {
                    // JSON parse failed, try regex fallback
                }
            }

            // Fallback: look for standard og:image tag on search page
            const ogMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/);
            if (ogMatch && ogMatch[1] && ogMatch[1].startsWith('http')) {
                return ogMatch[1];
            }

            // Fallback: look for product image patterns in raw HTML
            const imgMatch = html.match(/https:\/\/[^"'\s]+supermart[^"'\s]+\.(jpg|jpeg|png|webp)/i);
            if (imgMatch) return imgMatch[0];
        }
    } catch (err) {
        console.warn(`Supermart.ng lookup failed for "${name}":`, err);
    }

    // --- Strategy 2: Open Food Facts product search ---
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

    // --- Strategy 3: Wikipedia thumbnail ---
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

    // --- Strategy 4: placehold.co text label (never 404s) ---
    return `https://placehold.co/400x400?text=${encodeURIComponent(name)}`;
}
