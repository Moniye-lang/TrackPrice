import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.supermart.ng/collections/fresh-food', { waitUntil: 'domcontentloaded' });
    
    const result = await page.evaluate(() => {
        // @ts-ignore
        if (typeof getProducts === 'function') {
            // @ts-ignore
            return getProducts();
        }
        return 'getProducts not found';
    });
    
    console.log('Result type:', typeof result);
    if (Array.isArray(result)) {
        console.log('Found', result.length, 'products');
        console.log('First one:', JSON.stringify(result[0], null, 2));
    } else {
        console.log(result);
    }
    
    await browser.close();
})();
