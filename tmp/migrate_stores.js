const mongoose = require('mongoose');

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
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/track-price');
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
            // Try to find a store that matches part of the storeLocation string
            const matchedStore = stores.find(s => {
                const nameMatch = product.storeLocation.toLowerCase().includes(s.name.toLowerCase());
                // Area match is optional but good for precision
                const areaMatch = s.area && product.storeLocation.toLowerCase().includes(s.area.toLowerCase());
                return nameMatch; 
            });

            if (matchedStore) {
                await Product.updateOne(
                    { _id: product._id },
                    { $set: { storeId: matchedStore._id } }
                );
                matchedCount++;
                if (matchedCount % 50 === 0) console.log(`Migrated ${matchedCount} products...`);
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
