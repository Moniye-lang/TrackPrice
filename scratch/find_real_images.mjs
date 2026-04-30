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
}, { timestamps: true, strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function findRealImages() {
    try {
        await mongoose.connect(mongodbUri);
        const targetLocation = 'Oje market,Oje - Oyo';
        
        const products = await Product.find({
            storeLocation: targetLocation,
            imageUrl: { $not: { $regex: 'placehold', $options: 'i' } }
        }).limit(100).select('imageUrl name');
        
        console.log('Real Image Examples in Oje Market:');
        console.log(JSON.stringify(products, null, 2));

    } catch (error) {
        console.error('Search failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

findRealImages();
