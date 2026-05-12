export interface ExtractedProduct {
    name: string;
    price: number;
    imageUrl: string;
    category?: string;
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
        // Priority 1: Find the number immediately following a currency symbol
        const currencyMatch = text.match(/[₦$£€]\s?([\d,]+(\.\d+)?)/);
        if (currencyMatch) {
            return parseFloat(currencyMatch[1].replace(/,/g, ''));
        }

        // Priority 2: Extract the last valid number in the string (often the price)
        const allNumbers = text.match(/[\d,]+(\.\d+)?/g);
        if (allNumbers && allNumbers.length > 0) {
            const lastNum = allNumbers[allNumbers.length - 1].replace(/,/g, '');
            const val = parseFloat(lastNum);
            if (!isNaN(val) && val > 0) return val;
        }

        return null;
    };

    const add = (name: string, price: number, imageUrl?: string, category?: string) => {
        const key = name.toLowerCase().trim();
        if (name && name.length > 2 && !seen.has(key) && price > 0) {
            results.push({
                name: name.replace(/\s+/g, ' ').trim(),
                price,
                imageUrl: imageUrl || `https://placehold.co/600x400/png?text=${encodeURIComponent(name)}`,
                category: category || 'Uncategorized'
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
        try {
            const { chromium } = require('playwright');
            browser = await chromium.launch({ headless: true });
        } catch (err: any) {
            throw new Error(`Local Browser Launch Failed: ${err.message}. Ensure you have run 'npx playwright install chromium'.`);
        }
    } else {
        const chromium = require('@sparticuz/chromium');
        const { chromium: coreChromium } = require('playwright-core');
        chromium.setGraphicsMode = false;

        let retries = 3;
        while (retries > 0) {
            try {
                const executablePath = await chromium.executablePath();
                browser = await coreChromium.launch({
                    args: chromium.args,
                    defaultViewport: chromium.defaultViewport,
                    executablePath,
                    headless: chromium.headless,
                });
                break; // Success
            } catch (err: any) {
                retries--;
                if (err.message.includes('ETXTBSY') && retries > 0) {
                    console.warn(`ETXTBSY encountered. Retrying browser launch... (${retries} attempts left)`);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                } else {
                    throw new Error(`Cloud Browser Launch Failed: ${err.message}. Check @sparticuz/chromium compatibility.`);
                }
            }
        }
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
            // Use 'load' instead of 'networkidle' as many sites have persistent background network activity
            await page.goto(url, { waitUntil: 'load', timeout: 30000 });
        } catch {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await page.waitForTimeout(3000); // Give it a bit more time for JS to render grid
        }

        const products = await page.evaluate((pageUrl: string) => {
            const results: { name: string, price: number, imageUrl: string, category?: string }[] = [];
            const processedNames = new Set<string>();

            const parsePrice = (text: string): number | null => {
                // Priority 1: Find the number immediately following a currency symbol
                const currencyMatch = text.match(/[₦$£€]\s?([\d,]+(\.\d+)?)/);
                if (currencyMatch) {
                    return parseFloat(currencyMatch[1].replace(/,/g, ''));
                }

                // Priority 2: Extract the last valid number in the string (often the price)
                const allNumbers = text.match(/[\d,]+(\.\d+)?/g);
                if (allNumbers && allNumbers.length > 0) {
                    const lastNum = allNumbers[allNumbers.length - 1].replace(/,/g, '');
                    const val = parseFloat(lastNum);
                    if (!isNaN(val) && val > 0) return val;
                }

                return null;
            };

            const addProduct = (name: string, price: number, imageUrl?: string, category?: string) => {
                const key = name.toLowerCase().trim();
                if (name && name.length > 2 && !processedNames.has(key) && price > 0) {
                    results.push({
                        name: name.replace(/\s+/g, ' ').trim(),
                        price,
                        imageUrl: imageUrl || `https://placehold.co/600x400/png?text=${encodeURIComponent(name)}`,
                        category: category || 'Uncategorized'
                    });
                    processedNames.add(key);
                }
            };

            // Jumia
            if (pageUrl.includes('jumia.com')) {
                const breadcrumb = document.querySelector('.brdms, .breadcrumb, [class*="breadcrumb"]') as HTMLElement;
                const pageCategory = breadcrumb?.innerText.split('>').pop()?.trim() || 'Uncategorized';

                document.querySelectorAll('article.prd, div.prd, [class*="sku-"], [class*="productItem"]').forEach(card => {
                    const nameEl = card.querySelector('div.name, h3.name, a.core, [class*="name"], [class*="title"]') as HTMLElement | null;
                    const priceEl = card.querySelector('div.prc, span.prc, [class*="price"]') as HTMLElement | null;
                    const imgEl = card.querySelector('img.img, img[data-src], [class*="image"] img') as HTMLImageElement | null;
                    if (nameEl && priceEl) {
                        const price = parsePrice(priceEl.innerText);
                        let imageUrl = imgEl?.getAttribute('data-src') || imgEl?.src || '';
                        if (imageUrl.startsWith('data:image')) imageUrl = imgEl?.getAttribute('data-src') || '';
                        if (price) addProduct(nameEl.innerText.trim(), price, imageUrl, pageCategory);
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

            // Supermart.ng (Shopify-based structure)
            if (pageUrl.includes('supermart.ng')) {
                // Target the grid items specifically
                const selectors = [
                    '.grid__item', 
                    '.product-item', 
                    '.product-block', 
                    '.product-card',
                    '[id^="product-"]',
                    '.js-prod-link'
                ];
                
                const cards = document.querySelectorAll(selectors.join(', '));
                
                cards.forEach(card => {
                    // Avoid nested cards
                    if (card.parentElement?.closest(selectors.join(', '))) return;

                    // Supermart often uses .js-prod-link for the name or a descendant
                    const nameEl = card.querySelector('.js-prod-link, .product-title, .title, [class*="title"], [class*="name"], h3, h4') as HTMLElement | null;
                    const priceEl = card.querySelector('.price, .price-item, .current-price, [class*="price"], .money') as HTMLElement | null;
                    const imgEl = card.querySelector('img') as HTMLImageElement | null;
                    
                    if (nameEl && priceEl) {
                        const name = nameEl.innerText.trim();
                        const price = parsePrice(priceEl.innerText);
                        
                        let imageUrl = imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-lazy-src') || imgEl?.src || '';
                        
                        // Handle Shopify's lazy loading images
                        if (imageUrl.startsWith('data:image') || imageUrl.includes('blank.gif')) {
                             imageUrl = imgEl?.srcset?.split(' ')?.[0] || imgEl?.getAttribute('data-src') || '';
                        }
                        
                        // Clean up name (remove "Add to cart", "Save", etc.)
                        const cleanName = name.split('\n')[0].replace(/Sale|Sold Out|New/gi, '').trim();
                        
                        if (cleanName && cleanName.length > 2 && price) {
                            addProduct(cleanName, price, imageUrl);
                        }
                    }
                });
                if (results.length > 0) return results;
            }

            // Chowdeck / food apps
            if (pageUrl.includes('chowdeck.com') || pageUrl.includes('food')) {
                // Determine current category if possible from headers
                let currentCategory = 'Uncategorized';

                // Target all elements that look like a product container
                // We use a more specific set of selectors to avoid matching the whole page
                document.querySelectorAll('div[role="tabpanel"] span, div[role="tabpanel"] div, article').forEach(card => {
                    // Skip if the element is a container for other potential products
                    if (card.querySelectorAll('span, p, h3').length > 15) return;

                    // Small elements are usually children of the actual card
                    if (card.clientHeight < 50 || card.clientWidth < 50) return;

                    const priceText = (card as HTMLElement).innerText;
                    if (!priceText.includes('₦')) return;

                    // Skip if out of stock
                    if (priceText.toLowerCase().includes('out of stock')) return;

                    // Find product name: usually a heading or bold text
                    const nameEl = card.querySelector('h1, h2, h3, h4, h5, strong, p[class*="font-bold"]') as HTMLElement | null;
                    const priceEl = Array.from(card.querySelectorAll('p, span, div')).find(el => el.textContent?.includes('₦')) as HTMLElement | null;
                    const imgEl = card.querySelector('img') as HTMLImageElement | null;

                    if (nameEl && priceEl) {
                        const name = nameEl.innerText.trim();
                        // Ignore the store title and very short names
                        if (name.toLowerCase().includes('market') && name.length > 15) return;
                        if (name.length < 3) return;

                        const price = parsePrice(priceEl.innerText);
                        if (!price) return;

                        let imageUrl = imgEl?.getAttribute('data-src') || imgEl?.src || '';
                        if (imageUrl.startsWith('data:image')) imageUrl = '';

                        // Only add if we haven't seen this exact name/price combo or if this name is shorter (cleaner)
                        addProduct(name, price, imageUrl, currentCategory);
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
                if (priceVal === null || priceVal <= 0) continue;
                
                let current: HTMLElement | null = pNode.el;
                let finalName = '';
                
                // Climb up to find a container that might have a title
                for (let i = 0; i < 6; i++) {
                    if (!current) break;
                    
                    // Look for headings or bold text that isn't too long
                    const potentialNames = Array.from(current.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,b,span[class*="title"],div[class*="name"]'));
                    for (const h of potentialNames) {
                        const ht = (h as HTMLElement).innerText.trim();
                        // Filter out common UI strings and the price itself
                        if (ht && ht.length > 3 && ht.length < 100 && 
                            !ht.includes('₦') && 
                            !ht.toLowerCase().includes('add to cart') &&
                            !ht.toLowerCase().includes('view details')) { 
                            finalName = ht; 
                            break; 
                        }
                    }
                    if (finalName) break;
                    current = current.parentElement;
                }
                
                if (finalName) {
                    // Try to find an image in the same container
                    let imageUrl = '';
                    if (current) {
                        const img = current.querySelector('img') as HTMLImageElement | null;
                        if (img) {
                            imageUrl = img.getAttribute('data-src') || img.src || '';
                            if (imageUrl.startsWith('data:image')) imageUrl = '';
                        }
                    }
                    addProduct(finalName, priceVal, imageUrl);
                }
            }

            return results;
        }, url);

        if (products.length === 0) {
            console.warn('No products detected using structural heuristics.');
        }

        return products;
    } catch (error: any) {
        console.error('Scraping error:', error);
        throw error; // Re-throw the original error instead of masking it with a generic one
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (closeErr) {
                console.warn('Silent error closing browser:', closeErr);
            }
        }
    }
}
