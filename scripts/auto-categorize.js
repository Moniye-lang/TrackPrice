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
        
        console.log(`Analyzing ${products.length} products...`);
        let onlineCount = 0;
        let physicalCount = 0;
        let categoryUpdatedCount = 0;

        const strictOnline = ['jumia', 'konga', 'glovo', 'chowdeck', 'supermart', 'jiji'];

        for (const p of products) {
            let isOnline = false;
            
            if (p.storeId) {
                const store = stores.find(s => s._id.toString() === p.storeId.toString());
                if (store && store.type === 'Online') {
                    isOnline = true;
                } else if (store && strictOnline.some(k => store.name.toLowerCase().includes(k))) {
                    isOnline = true;
                }
            }
            
            if (!isOnline && p.storeLocation) {
                if (strictOnline.some(k => p.storeLocation.toLowerCase().includes(k))) {
                    isOnline = true;
                }
            }
            
            p.marketCategory = isOnline ? 'Online' : 'Physical';
            
            const nameLower = p.name.toLowerCase();
            let newCat = p.category;
            
            const electKeywords = ['iphone', 'samsung', 'laptop', 'tv', 'television', 'infinix', 'tecno', 'charger', 'usb', 'airbuds', 'speaker', 'cable'];
            const grocKeywords = ['rice', 'beans', 'garri', 'yam', 'egg', 'bread', 'oil', 'chicken', 'beef', 'fish', 'tomato', 'pepper', 'onion', 'maggi', 'salt', 'sugar', 'spaghetti', 'indomie', 'noodles', 'milk'];
            const clothKeywords = ['shirt', 'shoe', 'sneaker', 'dress', 'trouser', 'jeans', 'bag', 't-shirt', 'polo', 'suit', 'watch'];
            const oilKeywords = ['petrol', 'diesel', 'gas', 'pms', 'ago', 'lpg'];
            const bookKeywords = ['book', 'pen', 'pencil', 'textbook', 'notebook', 'novel', 'stationery'];
            const homeKeywords = ['chair', 'table', 'bed', 'mattress', 'generator', 'fridge', 'refrigerator', 'freezer', 'fan', 'ac', 'cupboard'];
            
            if (!newCat || newCat === 'Other' || newCat === 'All') {
                if (electKeywords.some(k => nameLower.includes(k))) newCat = 'Electronics';
                else if (grocKeywords.some(k => nameLower.includes(k))) newCat = 'Groceries';
                else if (clothKeywords.some(k => nameLower.includes(k))) newCat = 'Clothing';
                else if (oilKeywords.some(k => nameLower.includes(k))) newCat = 'Oil and Gas';
                else if (bookKeywords.some(k => nameLower.includes(k))) newCat = 'Books';
                else if (homeKeywords.some(k => nameLower.includes(k))) newCat = 'Home';
                
                if (newCat !== p.category) {
                    p.category = newCat || 'Other';
                    categoryUpdatedCount++;
                }
            }
            
            if (p.marketCategory === 'Online') onlineCount++;
            else physicalCount++;
            
            await p.save();
        }
        
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
