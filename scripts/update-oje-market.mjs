import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local to get MONGODB_URI
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
    console.error('.env.local not found at ' + envPath);
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const mongodbUriMatch = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
const mongodbUri = mongodbUriMatch ? mongodbUriMatch[1] : null;

if (!mongodbUri) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
}

const ProductSchema = new mongoose.Schema({
    storeLocation: String,
}, { timestamps: true, strict: false });

const PriceUpdateSchema = new mongoose.Schema({
    storeLocation: String,
}, { timestamps: true, strict: false });

const StoreSchema = new mongoose.Schema({
    name: String,
    area: String,
    city: String
}, { timestamps: true, strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const PriceUpdate = mongoose.models.PriceUpdate || mongoose.model('PriceUpdate', PriceUpdateSchema);
const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);

async function updateLocations() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongodbUri);
        console.log('Connected successfully.');

        const targetString = 'Oje market,Oje - Oyo';
        const searchRegex = /oje market/i;

        // Update Products
        const prodResult = await Product.updateMany(
            { storeLocation: searchRegex, storeLocation: { $ne: targetString } },
            { $set: { storeLocation: targetString } }
        );
        console.log(`Updated ${prodResult.modifiedCount} Products.`);

        // Update PriceUpdates
        const puResult = await PriceUpdate.updateMany(
            { storeLocation: searchRegex, storeLocation: { $ne: targetString } },
            { $set: { storeLocation: targetString } }
        );
        console.log(`Updated ${puResult.modifiedCount} PriceUpdates.`);

        // Update Stores if name matches exactly (Optional, but let's check)
        const storeCount = await Store.countDocuments({ name: searchRegex });
        if (storeCount > 0) {
            console.log(`Found ${storeCount} Stores with 'oje market' in name. Updating area/city?`);
            // Usually Store name is just "Oje market". 
            // If they want "Oje market,Oje - Oyo", maybe they mean the store name?
            // Actually, in track-price, storeLocation is just a string used directly.
            // Let's just update the name to "Oje market" and area to "Oje" and city to "Oyo" if needed, 
            // OR we just leave Store alone since storeLocation is denormalized.
        }

    } catch (error) {
        console.error('Update failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

updateLocations();
