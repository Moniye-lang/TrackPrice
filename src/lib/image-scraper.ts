export async function findProductImage(productName: string): Promise<string | null> {
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
            if (['stylesheet', 'font', 'media'].includes(request.resourceType())) {
                route.abort();
            } else {
                route.continue();
            }
        });

        const query = encodeURIComponent(productName + ' product alone white background');
        // Search DuckDuckGo images
        await page.goto(`https://duckduckgo.com/?q=${query}&iax=images&ia=images`, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait a small amount for the image network requests or JS to render the tiles
        await page.waitForSelector('.tile--img', { timeout: 10000 });

        // DOM parsing logic executed in browser context
        const imgUrl = await page.evaluate(() => {
            const img = document.querySelector('.tile--img img.has-bg') as HTMLImageElement;
            if (img) {
                let src = img.getAttribute('src');
                if (!src || src.startsWith('data:')) {
                    src = img.getAttribute('data-src');
                }
                if (src) {
                    if (src.startsWith('//')) return 'https:' + src;
                    if (src.startsWith('http')) return src;
                }
            }
            return null;
        });

        return imgUrl;
    } catch (error) {
        console.error("Image Scraper error:", error);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}
