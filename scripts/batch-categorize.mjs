import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const MONGODB_URI = envContent.split('\n').find(line => line.trim().startsWith('MONGODB_URI='))?.split('MONGODB_URI=')[1]?.trim();

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env.local');
    process.exit(1);
}

const ProductSchema = new mongoose.Schema({
    name: String,
    category: String,
    marketCategory: String,
    storeId: mongoose.Schema.Types.ObjectId,
    storeLocation: String,
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

const StoreSchema = new mongoose.Schema({
    name: String,
    type: String,
});

const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected');

        // 1. Aggressive updates (Regardless of current category)
        console.log('Applying aggressive rules...');
        const freshFoodResult = await Product.updateMany(
            { name: { $regex: /rodo|tatashe|tomato/i } },
            { $set: { category: 'Fresh Food' } }
        );
        console.log(`- Updated ${freshFoodResult.modifiedCount} products to Fresh Food (Rodo/Tatashe/Tomato)`);

        const homeResult = await Product.updateMany(
            { name: { $regex: /ice block/i } },
            { $set: { category: 'Home' } }
        );
        console.log(`- Updated ${homeResult.modifiedCount} products to Home (Ice Block)`);

        // 2. Heuristic updates for Uncategorized/Other/All
        console.log('Applying heuristic rules for uncategorized items...');
        const uncategorizedQuery = {
            category: { $in: ['All', 'Other', 'Uncategorized', '', null] }
        };

        const rules = [
            { regex: /paint/i, cat: 'Fresh Food' },
            { regex: /iphone|samsung|laptop|tv|television|infinix|tecno|charger|usb/i, cat: 'Electronics' },
            { regex: /rice|beans|garri|yam|egg|bread|oil|chicken|beef|fish|onion/i, cat: 'Groceries' },
            { regex: /detergent|soap|hypo|harpic|mop|broom|cleaner|bleach|wash/i, cat: 'Cleaning' },
            { regex: /shirt|shoe|sneaker|dress|trouser|jeans|bag/i, cat: 'Clothing' },
            { regex: /petrol|diesel|gas|pms|ago|lpg/i, cat: 'Oil and Gas' },
            { regex: /book|pen|pencil|textbook|notebook/i, cat: 'Books' },
            { regex: /chair|table|bed|mattress|generator/i, cat: 'Home' }
        ];

        let heuristicCount = 0;
        for (const rule of rules) {
            const result = await Product.updateMany(
                { ...uncategorizedQuery, name: { $regex: rule.regex } },
                { $set: { category: rule.cat } }
            );
            heuristicCount += result.modifiedCount;
        }
        console.log(`- Applied heuristics to ${heuristicCount} products.`);

        // 3. Market Category Sync
        console.log('Syncing Market Categories...');
        const productsMissingMarket = await Product.find({ marketCategory: { $in: [null, ''] } });
        const stores = await Store.find({});
        const strictOnline = ['jumia', 'konga', 'glovo', 'chowdeck', 'supermart', 'jiji'];

        let marketCount = 0;
        for (const p of productsMissingMarket) {
            let isOnline = false;
            if (p.storeId) {
                const store = stores.find(s => s._id.toString() === p.storeId?.toString());
                if (store && (store.type === 'Online' || strictOnline.some(k => store.name.toLowerCase().includes(k)))) {
                    isOnline = true;
                }
            }
            if (!isOnline && p.storeLocation) {
                if (strictOnline.some(k => p.storeLocation.toLowerCase().includes(k))) {
                    isOnline = true;
                }
            }
            p.marketCategory = isOnline ? 'Online' : 'Physical';
            await p.save();
            marketCount++;
        }
        console.log(`- Synced Market Category for ${marketCount} products.`);

        console.log('Batch update complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

run();
