import mongoose from 'mongoose';
import fs from 'fs';
import 'dotenv/config';
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({
            name: String,
            storeLocation: String,
            storeId: mongoose.Schema.Types.ObjectId
        }));

        const PriceUpdate = mongoose.models.PriceUpdate || mongoose.model('PriceUpdate', new mongoose.Schema({
            productId: mongoose.Schema.Types.ObjectId,
            price: Number,
            storeLocation: String,
            storeId: mongoose.Schema.Types.ObjectId,
            status: String
        }));

        const Store = mongoose.models.Store || mongoose.model('Store', new mongoose.Schema({
            name: String
        }));

        // 1. Get all products in Oje Market
        const ojeProducts = await Product.find({ storeLocation: 'Oje market,Oje - Oyo' }).lean();
        console.log(`Found ${ojeProducts.length} products in Oje Market`);

        const ojeProductIds = ojeProducts.map(p => p._id);

        // 2. Find pending updates for these products
        const updates = await PriceUpdate.find({ 
            productId: { $in: ojeProductIds },
            status: 'pending'
        }).lean();

        console.log(`Found ${updates.length} pending updates for Oje Market products`);

        const results = [];
        for (const update of updates) {
            const product = ojeProducts.find(p => p._id.toString() === update.productId.toString());
            if (update.storeLocation && update.storeLocation !== 'Oje market,Oje - Oyo') {
                results.push({
                    productId: product._id,
                    productName: product.name,
                    newLocation: update.storeLocation,
                    updateId: update._id
                });
            } else if (update.storeId) {
                const store = await Store.findById(update.storeId);
                if (store) {
                    results.push({
                        productId: product._id,
                        productName: product.name,
                        newLocation: store.name,
                        storeId: store._id,
                        updateId: update._id
                    });
                }
            }
        }

        console.log(`Potential restores found via Verification Queue: ${results.length}`);
        console.log(JSON.stringify(results.slice(0, 10), null, 2));

        if (results.length > 0) {
            fs.writeFileSync('scratch/queue_matches.json', JSON.stringify(results, null, 2));
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.connection.close();
    }
}

run();
