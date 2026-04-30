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

const Store = mongoose.models.Product || mongoose.model('Store', StoreSchema);

async function findStoreNames() {
    try {
        await mongoose.connect(mongodbUri);
        const stores = await Store.find({}).select('name area city');
        console.log('Registered Stores:');
        stores.forEach(s => console.log(`${s.name} (${s.area}, ${s.city})`));
    } catch (error) {
        console.error('List failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

findStoreNames();
