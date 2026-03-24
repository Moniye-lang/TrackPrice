export interface ExtractedProduct {
    name: string;
    price: number;
}

export async function scrapeProducts(url: string): Promise<ExtractedProduct[]> {
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
        const page = await browser.newPage();

        // Block unnecessary resources to speed up rendering
        await page.route('**/*', (route: any) => {
            const request = route.request();
            if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
                route.abort();
            } else {
                route.continue();
            }
        });

        // Use networkidle to wait for JS-rendered content; fall back to timed wait
        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 40000 });
        } catch {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(4000);
        }

        // DOM parsing executed in browser context
        const products = await page.evaluate((pageUrl: string) => {
            const results: { name: string, price: number }[] = [];
            const processedNames = new Set<string>();

            const parsePrice = (text: string): number | null => {
                const cleanText = text.replace(/[^\d.]/g, '');
                const val = parseFloat(cleanText);
                return isNaN(val) || val <= 0 ? null : val;
            };

            const addProduct = (name: string, price: number) => {
                const key = name.toLowerCase().trim();
                if (name && name.length > 2 && !processedNames.has(key) && price > 0) {
                    results.push({ name: name.replace(/\s+/g, ' ').trim(), price });
                    processedNames.add(key);
                }
            };

            // ---- Site-specific extractors ----

            // Jumia (jumia.com.ng)
            if (pageUrl.includes('jumia.com')) {
                document.querySelectorAll('article.prd, div.prd').forEach(card => {
                    const nameEl = card.querySelector('div.name, h3.name, a.core') as HTMLElement | null;
                    const priceEl = card.querySelector('div.prc, span.prc, div[class*="price"]') as HTMLElement | null;
                    if (nameEl && priceEl) {
                        const price = parsePrice(priceEl.innerText);
                        if (price) addProduct(nameEl.innerText.trim(), price);
                    }
                });
                if (results.length > 0) return results;
            }

            // Konga (konga.com)
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

            // ---- Generic structural heuristics (fallback for any site) ----
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
                    const headings = current.querySelectorAll('h1, h2, h3, h4, h5, h6, strong');
                    if (headings.length > 0) {
                        for (const h of Array.from(headings)) {
                            const ht = (h as HTMLElement).innerText.trim();
                            if (ht && ht.length > 2 && !ht.toLowerCase().includes('add to cart')) {
                                finalName = ht;
                                break;
                            }
                        }
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
                            if (sibEl.children.length > 0) return;
                            if (!sibEl.textContent || sibEl.textContent.trim().length <= 2) return;
                            if (sibEl.closest('button') || sibEl.tagName === 'BUTTON') return;
                            const size = parseFloat(window.getComputedStyle(sibEl).fontSize) || 16;
                            if (size > largestSize && !/[₦$£€]/.test(sibEl.innerText)) {
                                largestSize = size;
                                finalName = sibEl.innerText.trim();
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
