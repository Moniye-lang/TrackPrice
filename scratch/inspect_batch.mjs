import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const mongodbUriMatch = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
const mongodbUri = mongodbUriMatch ? mongodbUriMatch[1] : null;

const ProductSchema = new mongoose.Schema({
    storeLocation: String,
    imageUrl: String,
    name: String,
    createdAt: Date
}, { timestamps: true, strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function inspectBatch() {
    try {
        await mongoose.connect(mongodbUri);
        // April 23rd batch
        const start = new Date('2026-04-23T00:00:00Z');
        const end = new Date('2026-04-24T00:00:00Z');
        
        const products = await Product.find({
            createdAt: { $gte: start, $lt: end },
            storeLocation: 'Oje market,Oje - Oyo'
        }).limit(20);
        
        console.log('April 23 Batch Samples:');
        console.log(JSON.stringify(products, null, 2));

    } catch (error) {
        console.error('Analysis failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

inspectBatch();
