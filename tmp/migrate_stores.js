const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let mongodbUri = 'mongodb://localhost:27017/track-price';
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
    if (match) mongodbUri = match[1];
}

// Define temporary schemas to avoid import issues
const StoreSchema = new mongoose.Schema({
    name: { type: String, required: true },
    area: { type: String, required: true },
});
const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);

const ProductSchema = new mongoose.Schema({
    name: String,
    storeId: mongoose.Schema.Types.ObjectId,
    storeLocation: String,
});
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function migrate() {
    try {
        await mongoose.connect(mongodbUri);
        console.log('Connected to DB');

        const stores = await Store.find({}).lean();
        console.log(`Found ${stores.length} stores for matching.`);

        const products = await Product.find({ 
            $or: [
                { storeId: { $exists: false } },
                { storeId: null }
            ],
            storeLocation: { $exists: true, $ne: null }
        }).lean();

        console.log(`Found ${products.length} products to potentially migrate.`);

        let matchedCount = 0;
        for (const product of products) {
            const loc = (product.storeLocation || '').toLowerCase().trim();
            if (!loc) continue;

            const matchedStore = stores.find(s => {
                const name = s.name.toLowerCase();
                // Match if name is in location or location is in name
                return loc.includes(name) || name.includes(loc) ||
                       // Handle "Bojida" typo
                       (name === 'bodija market' && loc.includes('bojida'));
            });

            if (matchedStore) {
                console.log(`Matching: "${product.storeLocation}" -> ${matchedStore.name}`);
                await Product.updateOne(
                    { _id: product._id },
                    { $set: { storeId: matchedStore._id } }
                );
                matchedCount++;
                if (matchedCount % 50 === 0) console.log(`Migrated ${matchedCount} products...`);
            } else {
                // Only log first few misses to avoid noise
                if (matchedCount < 5) console.log(`No match for: "${product.storeLocation}"`);
            }
        }

        console.log(`\nMigration complete! Total products updated: ${matchedCount}`);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
