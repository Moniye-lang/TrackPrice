import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const mongodbUriMatch = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
const mongodbUri = mongodbUriMatch ? mongodbUriMatch[1] : null;

async function checkQueue() {
    try {
        await mongoose.connect(mongodbUri);
        
        const PriceUpdate = mongoose.models.PriceUpdate || mongoose.model('PriceUpdate', new mongoose.Schema({}, { strict: false }));
        const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

        const pendingUpdates = await PriceUpdate.find({ status: 'pending' }).lean();
        console.log(`Found ${pendingUpdates.length} pending updates.`);

        for (const update of pendingUpdates) {
            const product = await Product.findById(update.productId).lean();
            console.log(`Update ID: ${update._id}`);
            console.log(`- Product: ${product ? product.name : 'Unknown'}`);
            console.log(`- Store: ${product ? product.storeLocation : 'Unknown'}`);
            console.log(`- Proposed Price: ${update.price}`);
            console.log(`- Current Price: ${product ? product.price : 'Unknown'}`);
            console.log('---');
        }

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkQueue();
