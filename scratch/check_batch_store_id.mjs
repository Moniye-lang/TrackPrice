import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const mongodbUriMatch = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
const mongodbUri = mongodbUriMatch ? mongodbUriMatch[1] : null;

const ProductSchema = new mongoose.Schema({
    storeId: mongoose.Schema.Types.ObjectId,
    createdAt: Date
}, { timestamps: true, strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function checkBatchStoreId() {
    try {
        await mongoose.connect(mongodbUri);
        const start = new Date('2026-04-23T00:00:00Z');
        const end = new Date('2026-04-24T00:00:00Z');
        
        const count = await Product.countDocuments({
            createdAt: { $gte: start, $lt: end },
            storeId: { $exists: true, $ne: null }
        });
        console.log(`Products in April 23 batch with storeId: ${count}`);
    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkBatchStoreId();
