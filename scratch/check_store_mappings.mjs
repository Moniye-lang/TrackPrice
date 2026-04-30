import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const mongodbUriMatch = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
const mongodbUri = mongodbUriMatch ? mongodbUriMatch[1] : null;

const ProductSchema = new mongoose.Schema({
    storeId: mongoose.Schema.Types.ObjectId,
}, { timestamps: true, strict: false });

const StoreSchema = new mongoose.Schema({
    name: String,
    area: String,
    city: String
}, { timestamps: true, strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);

async function checkStoreIdMappings() {
    try {
        await mongoose.connect(mongodbUri);
        const productsWithId = await Product.find({ 
            storeLocation: 'Oje market,Oje - Oyo',
            storeId: { $exists: true, $ne: null }
        }).limit(10);
        
        console.log('Sample Products with storeId (currently in Oje):');
        for (const p of productsWithId) {
            const store = await Store.findById(p.storeId);
            console.log(`Product: ${p.name} -> Store: ${store ? store.name + ' (' + store.area + ')' : 'NOT FOUND'}`);
        }
    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkStoreIdMappings();
