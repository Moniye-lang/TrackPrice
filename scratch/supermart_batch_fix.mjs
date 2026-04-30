import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const MONGODB_URI = "mongodb+srv://davidadeniyi269:Moniye@cluster0.zwijmfw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const filePaths = [
    'C:\\Users\\HP\\.gemini\\antigravity\\brain\\a5bda870-d66d-4b93-9e94-2216e0c89d4a\\.system_generated\\steps\\230\\content.md',
    'C:\\Users\\HP\\.gemini\\antigravity\\brain\\ee20c79f-116c-433b-bb42-59df20c550eb\\.system_generated\\steps\\105\\content.md',
    'C:\\Users\\HP\\.gemini\\antigravity\\brain\\ee20c79f-116c-433b-bb42-59df20c550eb\\.system_generated\\steps\\108\\content.md'
];

function extractProducts(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return [];
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const products = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('₦')) {
            // Price line usually has ₦ followed by numbers, maybe with decimals
            const match = line.match(/₦([\d,]+\.?\d*)/);
            if (match) {
                const price = parseFloat(match[1].replace(/,/g, ''));
                
                // Name is usually a few lines before
                let name = '';
                for (let j = i - 1; j > i - 15; j--) {
                    if (lines[j] && lines[j].trim() && 
                        !lines[j].includes('₦') && 
                        !lines[j].includes('[') && 
                        !lines[j].includes('Add to cart') &&
                        !lines[j].includes('Unit price') &&
                        lines[j].trim().length > 2) {
                        name = lines[j].trim();
                        break;
                    }
                }
                
                if (name && !isNaN(price)) {
                    products.push({ name, price });
                }
            }
        }
    }
    return products;
}

async function run() {
    try {
        let allScraped = [];
        for (const fp of filePaths) {
            const p = extractProducts(fp);
            console.log(`Extracted ${p.length} products from ${path.basename(path.dirname(fp))}/${path.basename(fp)}`);
            allScraped = allScraped.concat(p);
        }

        console.log(`Total scraped products: ${allScraped.length}`);

        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({
            name: String,
            storeLocation: String,
            price: Number
        }));

        const ojeProducts = await Product.find({ storeLocation: 'Oje market,Oje - Oyo' }).lean();
        console.log(`Found ${ojeProducts.length} products in Oje Market`);

        const matches = [];
        const seenIds = new Set();

        for (const sp of allScraped) {
            const found = ojeProducts.filter(p => 
                p.name.toLowerCase() === sp.name.toLowerCase() && 
                Math.abs(p.price - sp.price) < 1 &&
                !seenIds.has(p._id.toString())
            );

            for (const f of found) {
                matches.push({
                    productId: f._id,
                    productName: f.name,
                    price: f.price,
                    newLocation: 'Supermart.ng (Fresh Food)'
                });
                seenIds.add(f._id.toString());
            }
        }

        console.log(`Found ${matches.length} unique matches!`);
        
        if (matches.length > 0) {
            fs.writeFileSync('scratch/supermart_batch_matches.json', JSON.stringify(matches, null, 2));
            console.log("Batch matches saved to scratch/supermart_batch_matches.json");
            
            // Execute the move if requested? No, I'll just report first.
            // Wait, the user said "Continue" "fixing".
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.connection.close();
    }
}

run();
