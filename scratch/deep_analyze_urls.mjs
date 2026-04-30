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

async function deepAnalyzeUrls() {
    try {
        await mongoose.connect(mongodbUri);
        const products = await Product.find({ storeLocation: 'Oje market,Oje - Oyo' }).select('imageUrl name');
        
        const patterns = {};
        products.forEach(p => {
            if (p.imageUrl && !p.imageUrl.includes('unsplash') && !p.imageUrl.includes('placehold')) {
                try {
                    const url = new URL(p.imageUrl);
                    const domain = url.hostname;
                    patterns[domain] = (patterns[domain] || 0) + 1;
                } catch (e) {
                     // Try to get first part of path if not a full URL
                     const parts = p.imageUrl.split('/');
                     const firstPart = parts[0] || parts[1];
                     if (firstPart) patterns[firstPart] = (patterns[firstPart] || 0) + 1;
                }
            }
        });

        console.log('Interesting Image URL Domains (excluding placeholders):');
        const sorted = Object.entries(patterns).sort((a, b) => b[1] - a[1]);
        console.log(JSON.stringify(sorted.slice(0, 50), null, 2));

    } catch (error) {
        console.error('Analysis failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

deepAnalyzeUrls();
