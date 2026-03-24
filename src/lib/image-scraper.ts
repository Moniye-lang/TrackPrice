/**
 * findProductImage
 * Strategy 1: Wikipedia REST API (fast, free, works for many named products)
 * Strategy 2: loremflickr.com keyword URL (photo-based fallback, always returns something)
 */
export async function findProductImage(productName: string): Promise<string | null> {
    // --- Strategy 1: Wikipedia Thumbnail ---
    try {
        const wikiTitle = encodeURIComponent(productName.trim().replace(/\s+/g, '_'));
        const wikiRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`,
            { headers: { 'User-Agent': 'TrackPrice/1.0 (product-image-finder)' } }
        );
        if (wikiRes.ok) {
            const wikiData = await wikiRes.json();
            const thumb = wikiData?.originalimage?.source || wikiData?.thumbnail?.source;
            if (thumb) {
                return thumb;
            }
        }
    } catch (err) {
        console.warn(`Wikipedia lookup failed for "${productName}":`, err);
    }

    // --- Strategy 2: loremflickr keyword-based photo ---
    // This always returns a real image URL by redirecting to a Flickr photo
    // matching the given keyword. No API key needed.
    try {
        const keyword = encodeURIComponent(
            productName.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().split(' ').slice(0, 3).join('+')
        );
        // loremflickr serves real photos and returns a 302 redirect to the image
        // We return the loremflickr URL itself — browsers will follow the redirect
        return `https://loremflickr.com/400/400/${keyword}`;
    } catch {
        return null;
    }
}
