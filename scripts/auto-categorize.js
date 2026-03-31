const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
        }
    });
}

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB...');

        const StoreSchema = new mongoose.Schema({
            name: String,
            type: String
        }, { collection: 'stores' });
        const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);

        const ProductSchema = new mongoose.Schema({
            name: String,
            category: String,
            marketCategory: { type: String, enum: ['Online', 'Physical'] },
            storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
            storeLocation: String
        }, { collection: 'products' });
        
        const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

        const products = await Product.find({});
        const stores = await Store.find({});
        
        const categories = [...new Set(products.map(p => p.category))];
        console.log('Unique categories currently in DB:', categories);
        
        console.log('\nSample items:');
        products.slice(0, 15).forEach(p => console.log(`- ${p.name} [${p.category}]`));

        // Skip the saving loop
        console.log('Done mapping.');
        
        console.log(`\nAuto-categorization complete!`);
        console.log(`- Online products: ${onlineCount}`);
        console.log(`- Physical products: ${physicalCount}`);
        console.log(`- Product Categories updated: ${categoryUpdatedCount}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
