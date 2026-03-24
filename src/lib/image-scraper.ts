/**
 * findProductImage
 * Uses a plain fetch to search Bing Images for a product name and 
 * extracts the first image URL from the HTML response.
 * No browser or API key required.
 */
export async function findProductImage(productName: string): Promise<string | null> {
    try {
        const query = encodeURIComponent(productName + ' product');
        const url = `https://www.bing.com/images/search?q=${query}&form=HDRSC2&first=1`;

        const response = await fetch(url, {
            headers: {
                // Identify as a browser to get full HTML response
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml',
            },
        });

        if (!response.ok) {
            console.warn(`Bing image search returned status ${response.status} for: ${productName}`);
            return null;
        }

        const html = await response.text();

        // Bing encodes image data in "murl" JSON fields inside script tags / data attributes
        // Extract the first "murl":"http..." URL from the HTML
        const murlMatch = html.match(/"murl":"(https?:\/\/[^"]+)"/);
        if (murlMatch && murlMatch[1]) {
            return murlMatch[1];
        }

        // Fallback: try to find any iurl (img url) pattern
        const iurlMatch = html.match(/"iurl":"(https?:\/\/[^"]+)"/);
        if (iurlMatch && iurlMatch[1]) {
            return iurlMatch[1];
        }

        console.warn(`No image found for: ${productName}`);
        return null;
    } catch (error) {
        console.error(`Image search error for "${productName}":`, error);
        return null;
    }
}
