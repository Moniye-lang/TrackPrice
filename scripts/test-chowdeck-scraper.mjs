import { scrapeProducts } from '../src/lib/scraper.js';

const url = 'https://chowdeck.com/store/agungi/local-market/newroad-local-market-lekki-penninsula-ii23ak1t';

async function test() {
    console.log(`Testing scraper for: ${url}`);
    try {
        const results = await scrapeProducts(url);
        console.log(`Extracted ${results.length} products:`);
        results.slice(0, 10).forEach((p, i) => {
            console.log(`${i+1}. ${p.name} - ₦${p.price} [${p.category}]`);
        });
        if (results.length > 10) console.log('...');
    } catch (error) {
        console.error('Scraping failed:', error);
    }
}

test();
