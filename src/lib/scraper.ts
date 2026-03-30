export interface ExtractedProduct {
    name: string;
    price: number;
    imageUrl: string;
}

// -------------------------------------------------------
// Direct HTML fetch approach (no browser) — faster and
// avoids bot detection on sites that SSR their content.
// -------------------------------------------------------
async function fetchAndExtract(url: string): Promise<ExtractedProduct[]> {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
        }
    });

    if (!res.ok) throw new Error(`Fetch returned ${res.status}`);
    const html = await res.text();

    const results: ExtractedProduct[] = [];
    const seen = new Set<string>();

    const parsePrice = (text: string): number | null => {
        const clean = text.replace(/[^\d.]/g, '');
        const val = parseFloat(clean);
        return isNaN(val) || val <= 0 ? null : val;
    };

    const add = (name: string, price: number, imageUrl?: string) => {
        const key = name.toLowerCase().trim();
        if (name && name.length > 2 && !seen.has(key) && price > 0) {
            results.push({ 
                name: name.replace(/\s+/g, ' ').trim(), 
                price,
                imageUrl: imageUrl || `https://placehold.co/600x400?text=${encodeURIComponent(name)}`
            });
            seen.add(key);
        }
    };

    // --- Jumia: products are in JSON embedded as __jjsData or in <article> SSR HTML ---
    if (url.includes('jumia.com')) {
        // Try extracting from embedded product JSON in <script> tags
        const scriptMatches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g);
        for (const match of scriptMatches) {
            const content = match[1];
            // Jumia embeds product arrays in window.__jjsData or similar
            const jsonMatch = content.match(/window\.__jjsData\s*=\s*(\{[\s\S]*?\});/) ||
                content.match(/window\.__DATA__\s*=\s*(\{[\s\S]*?\});/) ||
                content.match(/"products"\s*:\s*(\[[\s\S]*?\])/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[1]);
                    const products = parsed?.catalog?.products || parsed?.products || (Array.isArray(parsed) ? parsed : []);
                    for (const p of products) {
                        const name = p?.name || p?.title;
                        const price = p?.price?.current || p?.prices?.finalPrice || p?.price;
                        const imageUrl = p?.image;
                        if (name && price) add(name, typeof price === 'number' ? price : parsePrice(String(price)) || 0, imageUrl);
                    }
                } catch { /* JSON parse failed, continue */ }
            }
            if (results.length > 0) break;
        }

        // Fallback: regex-based extraction of name/price from raw Jumia SSR HTML
        if (results.length === 0) {
            // Jumia SSR HTML has data-name and data-price attributes
            const productMatches = html.matchAll(/data-name="([^"]+)"[^>]*data-price="([^"]+)"[^>]*data-src="([^"]+)"/g);
            for (const m of productMatches) {
                const price = parsePrice(m[2]);
                if (price) add(m[1], price, m[3]);
            }

            // If still no images, try matching products with images separately
            if (results.length === 0) {
                const imgMatches = [...html.matchAll(/class="img"[^>]*src="([^"]+)"/g)];
                const nameMatches = [...html.matchAll(/class="name"[^>]*>([^<]{5,100})</g)];
                const priceMatches = [...html.matchAll(/class="prc"[^>]*>([^<]{2,30})</g)];
                const count = Math.min(nameMatches.length, priceMatches.length, imgMatches.length);
                for (let i = 0; i < count; i++) {
                    const price = parsePrice(priceMatches[i][1]);
                    if (price) add(nameMatches[i][1].trim(), price, imgMatches[i][1]);
                }
            }

            // Also try class-based SSR pattern
            const nameMatches = [...html.matchAll(/class="name"[^>]*>([^<]{5,100})</g)];
            const priceMatches = [...html.matchAll(/class="prc"[^>]*>([^<]{2,30})</g)];
            const count = Math.min(nameMatches.length, priceMatches.length);
            for (let i = 0; i < count; i++) {
                const price = parsePrice(priceMatches[i][1]);
                if (price) add(nameMatches[i][1].trim(), price);
            }
        }
    }

    return results;
}

// -------------------------------------------------------
// Playwright-based extraction (browser with stealth UA)
// -------------------------------------------------------
export async function scrapeProducts(url: string): Promise<ExtractedProduct[]> {
    // First try a lightweight fetch-based approach (avoids bot detection, faster)
    try {
        const fetchResults = await fetchAndExtract(url);
        if (fetchResults.length > 0) {
            return fetchResults;
        }
    } catch (err) {
        console.warn('Fetch-based extraction failed, falling back to browser:', err);
    }

    // Fall back to browser-based extraction for JS-heavy sites
    const isLocal = !process.env.VERCEL && process.env.NODE_ENV === 'development';

    let browser;
    if (isLocal) {
        const { chromium } = require('playwright');
        browser = await chromium.launch({ headless: true });
    } else {
        const chromium = require('@sparticuz/chromium');
        const { chromium: coreChromium } = require('playwright-core');
        chromium.setGraphicsMode = false;
        browser = await coreChromium.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });
    }

    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            locale: 'en-US',
            extraHTTPHeaders: {
                'Accept-Language': 'en-US,en;q=0.9',
            },
        });
        const page = await context.newPage();

        // Evasion: remove webdriver flag
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        // Only block fonts/media (allow images for sites that need them)
        await page.route('**/*', (route: any) => {
            if (['font', 'media'].includes(route.request().resourceType())) {
                route.abort();
            } else {
                route.continue();
            }
        });

        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 40000 });
        } catch {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(5000);
        }

        const products = await page.evaluate((pageUrl: string) => {
            const results: { name: string, price: number, imageUrl: string }[] = [];
            const processedNames = new Set<string>();

            const parsePrice = (text: string): number | null => {
                const cleanText = text.replace(/[^\d.]/g, '');
                const val = parseFloat(cleanText);
                return isNaN(val) || val <= 0 ? null : val;
            };

            const addProduct = (name: string, price: number, imageUrl?: string) => {
                const key = name.toLowerCase().trim();
                if (name && name.length > 2 && !processedNames.has(key) && price > 0) {
                    results.push({ 
                        name: name.replace(/\s+/g, ' ').trim(), 
                        price,
                        imageUrl: imageUrl || `https://placehold.co/600x400?text=${encodeURIComponent(name)}`
                    });
                    processedNames.add(key);
                }
            };

            // Jumia
            if (pageUrl.includes('jumia.com')) {
                document.querySelectorAll('article.prd, div.prd, [class*="sku-"], [class*="productItem"]').forEach(card => {
                    const nameEl = card.querySelector('div.name, h3.name, a.core, [class*="name"], [class*="title"]') as HTMLElement | null;
                    const priceEl = card.querySelector('div.prc, span.prc, [class*="price"]') as HTMLElement | null;
                    const imgEl = card.querySelector('img.img, img[data-src], [class*="image"] img') as HTMLImageElement | null;
                    if (nameEl && priceEl) {
                        const price = parsePrice(priceEl.innerText);
                        // Check multiple sources for lazy-loaded images (Jumia uses data-src or src)
                        let imageUrl = imgEl?.getAttribute('data-src') || imgEl?.src || '';
                        if (imageUrl.startsWith('data:image')) imageUrl = imgEl?.getAttribute('data-src') || '';
                        if (price) addProduct(nameEl.innerText.trim(), price, imageUrl);
                    }
                });
                if (results.length > 0) return results;
            }

            // Konga
            if (pageUrl.includes('konga.com')) {
                document.querySelectorAll('[class*="product-card"], [class*="ProductCard"]').forEach(card => {
                    const nameEl = card.querySelector('[class*="product-title"], [class*="name"]') as HTMLElement | null;
                    const priceEl = card.querySelector('[class*="price"], [class*="Price"]') as HTMLElement | null;
                    if (nameEl && priceEl) {
                        const price = parsePrice(priceEl.innerText);
                        if (price) addProduct(nameEl.innerText.trim(), price);
                    }
                });
                if (results.length > 0) return results;
            }

            // Chowdeck / food apps
            if (pageUrl.includes('chowdeck.com') || pageUrl.includes('food')) {
                document.querySelectorAll('[class*="menu-item"], [class*="MenuItem"], [class*="product"]').forEach(card => {
                    const nameEl = card.querySelector('h3, h4, strong, [class*="name"], [class*="title"]') as HTMLElement | null;
                    const priceEl = card.querySelector('[class*="price"], [class*="Price"]') as HTMLElement | null;
                    if (nameEl && priceEl) {
                        const price = parsePrice(priceEl.innerText);
                        if (price) addProduct(nameEl.innerText.trim(), price);
                    }
                });
                if (results.length > 0) return results;
            }

            // Generic heuristic fallback
            const textNodes: { el: HTMLElement, text: string, type: 'price' | 'text' }[] = [];
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null);
            let node;
            while ((node = walker.nextNode())) {
                const el = node as HTMLElement;
                if (el.children.length === 0 && el.textContent) {
                    const text = el.textContent.trim();
                    if (text.length === 0) continue;
                    if (el.closest('button') || el.tagName === 'BUTTON') continue;
                    if (/[₦$£€]|\b\d{1,3}(,\d{3})+(\.\d{2})?\b/.test(text)) {
                        textNodes.push({ el, text, type: 'price' });
                    } else if (text.length > 2) {
                        textNodes.push({ el, text, type: 'text' });
                    }
                }
            }

            for (const pNode of textNodes.filter(n => n.type === 'price')) {
                const priceVal = parsePrice(pNode.text);
                if (priceVal === null) continue;
                let current: HTMLElement | null = pNode.el;
                let finalName = '';
                for (let i = 0; i < 5; i++) {
                    if (!current) break;
                    for (const h of Array.from(current.querySelectorAll('h1,h2,h3,h4,h5,h6,strong'))) {
                        const ht = (h as HTMLElement).innerText.trim();
                        if (ht && ht.length > 2 && !ht.toLowerCase().includes('add to cart')) { finalName = ht; break; }
                    }
                    if (finalName) break;
                    current = current.parentElement;
                }
                if (!finalName) {
                    const container = pNode.el.parentElement;
                    if (container) {
                        let largestSize = 0;
                        Array.from(container.querySelectorAll('*')).forEach(sib => {
                            const sibEl = sib as HTMLElement;
                            if (sibEl.children.length > 0 || !sibEl.textContent || sibEl.textContent.trim().length <= 2) return;
                            if (sibEl.closest('button') || sibEl.tagName === 'BUTTON') return;
                            const size = parseFloat(window.getComputedStyle(sibEl).fontSize) || 16;
                            if (size > largestSize && !/[₦$£€]/.test(sibEl.innerText)) {
                                largestSize = size; finalName = sibEl.innerText.trim();
                            }
                        });
                    }
                }
                if (finalName) addProduct(finalName, priceVal);
            }

            return results;
        }, url);

        if (products.length === 0) {
            console.warn('No products detected using structural heuristics.');
        }

        return products;
    } catch (error) {
        console.error('Scraping error:', error);
        throw new Error('Failed to extract products. Ensure the URL is accessible and valid.');
    } finally {
        await browser.close();
    }
}
