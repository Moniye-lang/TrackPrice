import fs from 'fs';
import path from 'path';

const contentPath = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\a5bda870-d66d-4b93-9e94-2216e0c89d4a\\.system_generated\\steps\\230\\content.md';
const content = fs.readFileSync(contentPath, 'utf-8');

// Regex to find names and prices
// Example:
// 1885:             Mango - Sheri x5
// 1886: 
// 1887:     ₦950.00
const products = [];
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('₦')) {
        const priceStr = line.replace('₦', '').replace(/,/g, '');
        const price = parseFloat(priceStr);
        
        // Product name is usually a few lines before
        let name = '';
        for (let j = i - 1; j > i - 10; j--) {
            if (lines[j] && lines[j].trim() && !lines[j].includes('₦') && !lines[j].includes('[') && !lines[j].includes('Add to cart')) {
                name = lines[j].trim();
                break;
            }
        }
        
        if (name && !isNaN(price)) {
            products.push({ name, price });
        }
    }
}

console.log(JSON.stringify(products, null, 2));
