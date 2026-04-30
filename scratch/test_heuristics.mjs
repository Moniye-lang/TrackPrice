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

async function findHeuristics() {
    try {
        await mongoose.connect(mongodbUri);
        const targetLocation = 'Oje market,Oje - Oyo';
        
        const keywords = ['bovas', 'shoprite', 'foodco', 'ace', 'dugbe', 'bodija', 'akobo', 'ring road', 'bashorun', 'oje', 'agodi', 'challenge'];
        const results = {};

        for (const kw of keywords) {
            const count = await Product.countDocuments({
                storeLocation: targetLocation,
                imageUrl: { $regex: kw, $options: 'i' }
            });
            results[kw] = count;
        }

        console.log('Keyword matches in Image URLs (within Oje Market):');
        console.log(JSON.stringify(results, null, 2));

        // Let's also see some examples for 'bovas' and 'shoprite'
        const bovasExamples = await Product.find({
            storeLocation: targetLocation,
            imageUrl: { $regex: 'bovas', $options: 'i' }
        }).limit(5).select('imageUrl name');
        
        console.log('\nBovas Examples:');
        console.log(JSON.stringify(bovasExamples, null, 2));

        const shopriteExamples = await Product.find({
            storeLocation: targetLocation,
            imageUrl: { $regex: 'shoprite', $options: 'i' }
        }).limit(5).select('imageUrl name');
        
        console.log('\nShoprite Examples:');
        console.log(JSON.stringify(shopriteExamples, null, 2));

    } catch (error) {
        console.error('Search failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

findHeuristics();
