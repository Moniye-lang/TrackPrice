import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const mongodbUriMatch = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
const mongodbUri = mongodbUriMatch ? mongodbUriMatch[1] : null;

const ProductSchema = new mongoose.Schema({
    storeId: mongoose.Schema.Types.ObjectId,
    storeLocation: String
}, { timestamps: true, strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function checkStoreId() {
    try {
        await mongoose.connect(mongodbUri);
        const total = await Product.countDocuments({ storeLocation: 'Oje market,Oje - Oyo' });
        const withStoreId = await Product.countDocuments({ 
            storeLocation: 'Oje market,Oje - Oyo',
            storeId: { $exists: true, $ne: null }
        });
        console.log(`Total corrupted products: ${total}`);
        console.log(`Products with storeId: ${withStoreId}`);
    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkStoreId();
