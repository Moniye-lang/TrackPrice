const mongoose = require('mongoose');

// Define temporary schemas to avoid import issues
const StoreSchema = new mongoose.Schema({
    name: String,
    area: String,
});
const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);

const ProductSchema = new mongoose.Schema({
    name: String,
    storeId: mongoose.Schema.Types.ObjectId,
    storeLocation: String,
});
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/track-price');
        console.log('Connected to DB');

        const stores = await Store.find({}).lean();
        console.log(`Found ${stores.length} stores:`);
        stores.forEach(s => console.log(`- ${s.name} (${s.area}) [${s._id}]`));

        const products = await Product.find({}).limit(10).lean();
        console.log(`\nFound ${products.length} products (sample):`);
        products.forEach(p => {
            console.log(`- ${p.name}: storeId=${p.storeId}, storeLocation=${p.storeLocation}`);
        });

        // Check if there are products with storeId that match NO store
        const orphanedProducts = await Product.find({ 
            storeId: { $exists: true, $ne: null } 
        }).lean();
        
        const storeIds = stores.map(s => s._id.toString());
        const orphans = orphanedProducts.filter(p => !storeIds.includes(p.storeId.toString()));
        console.log(`\nProducts with non-existent storeId: ${orphans.length}`);
        if (orphans.length > 0) {
            console.log('Sample orphans:', orphans.slice(0, 3).map(o => o.name));
        }

        // Check products with storeLocation but NO storeId
        const legacyProducts = await Product.find({ 
            storeId: { $exists: false },
            storeLocation: { $exists: true, $ne: null }
        }).lean();
        console.log(`Products with storeLocation only: ${legacyProducts.length}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
