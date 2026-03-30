const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
let mongodbUri = 'mongodb://localhost:27017/track-price';
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
    if (match) mongodbUri = match[1];
}

async function inspect() {
    try {
        await mongoose.connect(mongodbUri);
        
        const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({ storeLocation: String }));
        
        const locations = await Product.distinct('storeLocation');
        console.log('Unique Store Locations in DB:');
        console.log(locations.slice(0, 20)); // First 20
        
        const Store = mongoose.models.Store || mongoose.model('Store', new mongoose.Schema({ name: String }));
        const stores = await Store.find({}).lean();
        console.log('\nSeeded Store Names:');
        console.log(stores.map(s => s.name));
        
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
