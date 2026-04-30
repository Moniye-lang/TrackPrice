import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const mongodbUriMatch = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
const mongodbUri = mongodbUriMatch ? mongodbUriMatch[1] : null;

async function checkMovedUpdates() {
    try {
        await mongoose.connect(mongodbUri);
        
        const PriceUpdate = mongoose.models.PriceUpdate || mongoose.model('PriceUpdate', new mongoose.Schema({}, { strict: false }));
        const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

        // Find products at Supermart.ng (Fresh Food)
        const products = await Product.find({ storeLocation: 'Supermart.ng (Fresh Food)' }).lean();
        const productIds = products.map(p => p._id);

        console.log(`Checking updates for ${products.length} products moved to Supermart...\n`);

        const pendingUpdates = await PriceUpdate.find({ 
            productId: { $in: productIds },
            status: 'pending' 
        }).lean();

        if (pendingUpdates.length === 0) {
            console.log('No pending updates found for these products.');
        } else {
            console.log(`Found ${pendingUpdates.length} pending updates:`);
            for (const update of pendingUpdates) {
                const product = products.find(p => p._id.toString() === update.productId.toString());
                console.log(`Update ID: ${update._id}`);
                console.log(`- Product: ${product.name}`);
                console.log(`- Proposed: ₦${update.price}`);
                console.log(`- Current DB: ₦${product.price}`);
                console.log('---');
            }
        }

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkMovedUpdates();
