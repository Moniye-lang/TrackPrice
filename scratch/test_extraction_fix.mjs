import { scrapeProducts } from '../src/lib/scraper.js';

(async () => {
    const url = 'https://www.supermart.ng/collections/fresh-food';
    console.log(`Starting extraction for: ${url}`);
    
    try {
        const results = await scrapeProducts(url);
        console.log(`Successfully extracted ${results.length} products.`);
        
        if (results.length > 0) {
            console.log('First 3 products:');
            console.log(JSON.stringify(results.slice(0, 3), null, 2));
        } else {
            console.log('No products found.');
        }
    } catch (err) {
        console.error('Extraction failed:', err.message);
    }
})();
