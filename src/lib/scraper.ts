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

        // Block resources that are not needed to speed up rendering
        await page.route('**/*', (route: any) => {
            const request = route.request();
            if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
                route.abort();
            } else {
                route.continue();
            }
        });

        // Use networkidle to ensure dynamic content loads
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        // DOM parsing logic executed in browser context
        const products = await page.evaluate(() => {
            const results: { name: string, price: number }[] = [];

            const parsePrice = (text: string): number | null => {
                const cleanText = text.replace(/[^\d.]/g, ''); // strip to digits and decimal point
                const val = parseFloat(cleanText);
                return isNaN(val) || val <= 0 ? null : val;
            };

            // 1. Find all leaf nodes with text
            const textNodes: { el: HTMLElement, text: string, type: 'price' | 'text' }[] = [];
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null);
            let node;
            while ((node = walker.nextNode())) {
                const el = node as HTMLElement;
                // Only consider elements with direct text content and no element children (or very few text nodes)
                if (el.children.length === 0 && el.textContent) {
                    const text = el.textContent.trim();
                    if (text.length === 0) continue;

                    // Ignore buttons
                    if (el.closest('button') || el.tagName === 'BUTTON') continue;

                    // Check if price (currency symbol or large formatted number like 1,500)
                    if (/[₦$£€]|\b\d{1,3}(,\d{3})+(\.\d{2})?\b/.test(text)) {
                        textNodes.push({ el, text, type: 'price' });
                    } else if (text.length > 2) {
                        textNodes.push({ el, text, type: 'text' });
                    }
                }
            }

            const processedNames = new Set<string>();

            // 2. For each price node, try to find a sibling or ancestor product name
            for (const pNode of textNodes.filter(n => n.type === 'price')) {
                const priceVal = parsePrice(pNode.text);
                if (priceVal === null) continue;

                // Go up the tree to find a container with a valid name
                let current: HTMLElement | null = pNode.el;
                let finalName = '';

                // Heuristic: traverse up to 5 levels
                for (let i = 0; i < 5; i++) {
                    if (!current) break;

                    // Look for headings inside this container
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
                    // Find the largest text node in the same generic container
                    let container = pNode.el.parentElement;
                    if (container) {
                        let largestSize = 0;
                        const siblings = Array.from(container.querySelectorAll('*')).filter(el => {
                            return el.children.length === 0 && el.textContent && el.textContent.trim().length > 2;
                        });

                        for (const sib of siblings) {
                            const sibEl = sib as HTMLElement;
                            if (sibEl.closest('button') || sibEl.tagName === 'BUTTON') continue;
                            const style = window.getComputedStyle(sibEl);
                            const size = parseFloat(style.fontSize) || 16;

                            if (size > largestSize && !/[₦$£€]/.test(sibEl.innerText)) {
                                largestSize = size;
                                finalName = sibEl.innerText.trim();
                            }
                        }
                    }
                }

                if (finalName && !processedNames.has(finalName.toLowerCase())) {
                    // Clean text and deduplicate
                    let clean = finalName.replace(/\s+/g, ' ');
                    results.push({ name: clean, price: priceVal });
                    processedNames.add(clean.toLowerCase());
                }
            }

            return results;
        });

        // Check if no products found, fallback if necessary (can be improved)
        if (products.length === 0) {
            console.warn("No products detected using structural heuristics.");
        }

        return products;
    } catch (error) {
        console.error("Scraping error:", error);
        throw new Error("Failed to extract products. Ensure the URL is accessible and valid.");
    } finally {
        await browser.close();
    }
}
