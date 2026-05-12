import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log('Navigating to Supermart...');
  await page.goto('https://www.supermart.ng/collections/fresh-food', { waitUntil: 'networkidle' });

  console.log('Extracting selectors...');
  const data = await page.evaluate(() => {
    const products = document.querySelectorAll('.grid__item, .product-item, .product-block, [class*="product-item"], [class*="product-card"]');
    if (products.length === 0) return { error: 'No products found with existing selectors' };

    const first = products[0];
    return {
        count: products.length,
        firstHtml: first.outerHTML.substring(0, 500),
        selectors: {
            container: first.className,
            name: first.querySelector('.js-prod-link, .product-title, .title, [class*="title"], [class*="name"]')?.className || 'not found',
            price: first.querySelector('.price, .price-item, .current-price, [class*="price"]')?.className || 'not found',
            image: first.querySelector('img')?.className || 'not found'
        }
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
