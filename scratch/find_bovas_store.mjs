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

async function findBovasStore() {
    try {
        await mongoose.connect(mongodbUri);
        const store = await Store.findOne({ name: /bovas/i });
        if (store) {
            console.log('Found Bovas Store:');
            console.log(JSON.stringify(store, null, 2));
        } else {
            console.log('Bovas Store not found.');
        }
    } catch (error) {
        console.error('Search failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

findBovasStore();
