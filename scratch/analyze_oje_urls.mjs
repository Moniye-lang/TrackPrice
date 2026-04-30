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

async function analyzeUrls() {
    try {
        await mongoose.connect(mongodbUri);
        const products = await Product.find({ storeLocation: 'Oje market,Oje - Oyo' }).limit(500).select('imageUrl name');
        
        const urlPatterns = {};
        products.forEach(p => {
            if (p.imageUrl) {
                try {
                    const url = new URL(p.imageUrl);
                    const domain = url.hostname;
                    urlPatterns[domain] = (urlPatterns[domain] || 0) + 1;
                } catch (e) {
                    // Not a valid URL or a path
                    const match = p.imageUrl.match(/([^\/]+)\//);
                    if (match) {
                        const firstFolder = match[1];
                        urlPatterns[firstFolder] = (urlPatterns[firstFolder] || 0) + 1;
                    }
                }
            }
        });

        console.log('Image URL Domain/Path Patterns in Oje Market:');
        console.log(JSON.stringify(urlPatterns, null, 2));

    } catch (error) {
        console.error('Analysis failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

analyzeUrls();
