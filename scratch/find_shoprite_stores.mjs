import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const mongodbUriMatch = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
const mongodbUri = mongodbUriMatch ? mongodbUriMatch[1] : null;

const StoreSchema = new mongoose.Schema({
    name: String,
    area: String,
    city: String
}, { timestamps: true, strict: false });

const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);

async function findShopriteStores() {
    try {
        await mongoose.connect(mongodbUri);
        const stores = await Store.find({ name: /shoprite/i });
        console.log('Shoprite Stores in Database:');
        console.log(JSON.stringify(stores, null, 2));
    } catch (error) {
        console.error('Search failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

findShopriteStores();
