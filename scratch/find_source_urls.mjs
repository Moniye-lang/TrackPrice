import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const mongodbUriMatch = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
const mongodbUri = mongodbUriMatch ? mongodbUriMatch[1] : null;

const ScrapedProductSchema = new mongoose.Schema({
    sourceUrl: String,
    name: String,
}, { timestamps: true, strict: false });

const ScrapedProduct = mongoose.models.ScrapedProduct || mongoose.model('ScrapedProduct', ScrapedProductSchema);

async function findSourceUrls() {
    try {
        await mongoose.connect(mongodbUri);
        const sources = await ScrapedProduct.distinct('sourceUrl');
        console.log('Unique Source URLs in ScrapedProduct:');
        console.log(JSON.stringify(sources, null, 2));
    } catch (error) {
        console.error('Search failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

findSourceUrls();
