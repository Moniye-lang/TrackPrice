import mongoose from 'mongoose';
import fs from 'fs';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    try {
        const supermartProducts = JSON.parse(fs.readFileSync('scratch/supermart_products.json', 'utf-8'));
        
        await mongoose.connect(MONGODB_URI);
        
        const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({
            name: String,
            storeLocation: String
        }));

        const PriceUpdate = mongoose.models.PriceUpdate || mongoose.model('PriceUpdate', new mongoose.Schema({
            productId: mongoose.Schema.Types.ObjectId,
            price: Number,
            status: String
        }));

        const pendingUpdates = await PriceUpdate.find({ status: 'pending' }).lean();
        console.log(`Analyzing ${pendingUpdates.length} pending updates`);

        const productIds = [...new Set(pendingUpdates.map(u => u.productId))];
        const products = await Product.find({ _id: { $in: productIds } }).lean();
        const productMap = new Map(products.map(p => [p._id.toString(), p]));

        const matches = [];
        for (const update of pendingUpdates) {
            const smMatch = supermartProducts.find(sp => Math.abs(sp.price - update.price) < 1);
            if (smMatch) {
                const product = productMap.get(update.productId.toString());
                matches.push({
                    updateId: update._id,
                    dbProductName: product ? product.name : 'Unknown',
                    dbProductLocation: product ? product.storeLocation : 'Unknown',
                    supermartName: smMatch.name,
                    price: update.price
                });
            }
        }

        console.log(`Found ${matches.length} price matches between Queue and Supermart`);
        console.log(JSON.stringify(matches, null, 2));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.connection.close();
    }
}

run();
