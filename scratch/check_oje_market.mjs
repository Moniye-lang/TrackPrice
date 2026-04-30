import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const mongodbUriMatch = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
const mongodbUri = mongodbUriMatch ? mongodbUriMatch[1] : null;

const StoreSchema = new mongoose.Schema({}, { strict: false });
const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);

async function getStores() {
    try {
        await mongoose.connect(mongodbUri);
        
        const stores = await Store.find({}, 'name area city');
        console.log(JSON.stringify(stores, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

getStores();
