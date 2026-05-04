import mongoose from 'mongoose';
import 'dotenv/config';
import fs from 'fs';
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({
            name: String,
            storeLocation: String,
            price: Number
        }));
        const PriceUpdate = mongoose.models.PriceUpdate || mongoose.model('PriceUpdate', new mongoose.Schema({
            productId: mongoose.Schema.Types.ObjectId,
            price: Number,
            storeLocation: String,
            status: String
        }));

        const updates = await PriceUpdate.find({ status: 'pending' }).lean();
        const productIds = updates.map(u => u.productId);
        const products = await Product.find({ _id: { $in: productIds } }).lean();
        const productMap = new Map(products.map(p => [p._id.toString(), p]));

        const results = updates.map(u => {
            const p = productMap.get(u.productId.toString());
            return {
                updateId: u._id,
                productName: p ? p.name : 'Unknown',
                currentLocation: p ? p.storeLocation : 'Unknown',
                currentPrice: p ? p.price : 0,
                updatePrice: u.price,
                updateLocation: u.storeLocation
            };
        });

        fs.writeFileSync('scratch/queue_dump.json', JSON.stringify(results, null, 2));
        console.log(`Dumped ${results.length} updates to scratch/queue_dump.json`);
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.connection.close();
    }
}
run();
