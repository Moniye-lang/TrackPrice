import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// 1. Load Environment Variables
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const mongodbUriMatch = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
const mongodbUri = mongodbUriMatch ? mongodbUriMatch[1] : null;

// 2. Setup Mongoose Schema
const ProductSchema = new mongoose.Schema({ name: String, category: String }, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// 3. Define Keyword Mapping
const categoryKeywords = {
    'Beverages': ['wine', 'drink', 'water', 'juice', 'beer', 'soda', 'coke', 'pepsi', 'fanta', 'sprite', 'malt', 'milk', 'tea', 'coffee', 'milo', 'bournvita', 'cooler', 'champagne', 'mojito', 'chapman', 'gin', 'vodka', 'whiskey', 'hennessy', 'rum', 'tequila', 'liqueur', 'tonic', 'chivas', 'baileys', 'campari', 'redbull', 'monster', 'energy', 'hollandia', 'chivita', '5alive', 'viju', 'yoghurt'],
    'Groceries': ['rice', 'beans', 'garri', 'semo', 'flour', 'spaghetti', 'macaroni', 'oil', 'palm', 'beef', 'meat', 'chicken', 'fish', 'pepper', 'tomato', 'onion', 'maggi', 'knorr', 'salt', 'sugar', 'yam', 'plantain', 'bread', 'egg', 'indomie', 'noodles', 'pasta', 'butter', 'margarine', 'cheese', 'mayo', 'ketchup', 'sardine', 'geisha', 'titus', 'corn', 'flakes', 'oats', 'cereal', 'biscuit', 'snack', 'chocolate', 'sweet', 'candy', 'nuggets', 'sausage', 'hotdog'],
    'Electronics': ['tv', 'television', 'phone', 'smartphone', 'laptop', 'computer', 'tablet', 'fridge', 'refrigerator', 'freezer', 'fan', 'iron', 'radio', 'blender', 'microwave', 'oven', 'ac', 'air conditioner', 'generator', 'battery', 'powerbank', 'charger', 'cable', 'earphone', 'headphone', 'speaker', 'camera', 'watch', 'smartwatch'],
    'Health & Beauty': ['soap', 'cream', 'lotion', 'perfume', 'spray', 'deodorant', 'roll-on', 'makeup', 'powder', 'lipstick', 'foundation', 'drug', 'medicine', 'panadol', 'paracetamol', 'malaria', 'typhoid', 'vitamin', 'supplement', 'shampoo', 'conditioner', 'hair', 'relaxer', 'dettol', 'bleach', 'wipe', 'tissue', 'pad', 'diaper', 'pampers', 'toothpaste', 'brush'],
    'Building Materials': ['cement', 'block', 'sand', 'iron', 'rod', 'wood', 'paint', 'nail', 'roofing', 'sheet'],
    'Clothing': ['shirt', 'trouser', 'shoe', 'bag', 'dress', 'gown', 'fabric', 'lace', 'ankara', 'polo', 'jeans', 'sneaker', 'sandal', 'slipper'],
    'Oil and Gas': ['petrol', 'fuel', 'gas', 'diesel', 'kerosene', 'engine oil'],
    'Home': ['bed', 'chair', 'table', 'pot', 'pan', 'spoon', 'plate', 'cup', 'detergent', 'cleaner']
};

// 4. Execution Logic
async function categorize() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(mongodbUri);

        const uncategorized = await Product.find({ category: 'Uncategorized' });
        console.log(`Found ${uncategorized.length} uncategorized products.`);

        let stats = {};
        Object.keys(categoryKeywords).forEach(k => stats[k] = 0);
        stats['Remaining Uncategorized'] = 0;

        let bulkOps = [];

        for (const product of uncategorized) {
            const nameLower = product.name.toLowerCase();
            let matchedCategory = null;

            // Sort categories by keyword length to match more specific keywords first if we wanted to,
            // but for now, first match wins.
            for (const [category, keywords] of Object.entries(categoryKeywords)) {
                if (keywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(nameLower))) {
                    matchedCategory = category;
                    break;
                }
            }

            if (matchedCategory) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: product._id },
                        update: { $set: { category: matchedCategory } }
                    }
                });
                stats[matchedCategory]++;
            } else {
                stats['Remaining Uncategorized']++;
            }

            // Execute in batches of 1000
            if (bulkOps.length >= 1000) {
                await Product.bulkWrite(bulkOps);
                bulkOps = [];
            }
        }

        // Execute remaining
        if (bulkOps.length > 0) {
            await Product.bulkWrite(bulkOps);
        }

        console.log('\nCategorization Complete!');
        console.log('------------------------');
        for (const [cat, count] of Object.entries(stats)) {
            console.log(`${cat}: ${count}`);
        }

    } catch (err) {
        console.error('Error during categorization:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

categorize();
