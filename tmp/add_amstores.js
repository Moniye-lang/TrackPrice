const mongoose = require('mongoose');

// Define temporary schemas to avoid import issues
const StoreSchema = new mongoose.Schema({
    name: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    type: { type: String, enum: ['Supermarket', 'Market', 'Other'], default: 'Supermarket' },
});
const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);

const ProductSchema = new mongoose.Schema({
    name: String,
    storeId: mongoose.Schema.Types.ObjectId,
    storeLocation: String,
});
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function addStoreAndMigrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/track-price');
        console.log('Connected to DB');

        // Add AMStores
        let amStore = await Store.findOne({ name: 'AMStores' });
        if (!amStore) {
            amStore = await Store.create({
                name: 'AMStores',
                area: 'Akobo',
                city: 'Ibadan',
                type: 'Supermarket'
            });
            console.log(`Created Store: ${amStore.name} [${amStore._id}]`);
        } else {
            console.log(`Store AMStores already exists [${amStore._id}]`);
        }

        // Migrate products
        const products = await Product.find({ 
            $or: [
                { storeId: { $exists: false } },
                { storeId: null }
            ],
            storeLocation: { $regex: /AMStores/i }
        }).lean();

        console.log(`Found ${products.length} products to update for AMStores.`);

        const result = await Product.updateMany(
            { 
                $or: [
                    { storeId: { $exists: false } },
                    { storeId: null }
                ],
                storeLocation: { $regex: /AMStores/i }
            },
            { $set: { storeId: amStore._id } }
        );

        console.log(`\nUpdated ${result.modifiedCount} products to point to AMStores.`);

    } catch (err) {
        console.error('Action failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

addStoreAndMigrate();
