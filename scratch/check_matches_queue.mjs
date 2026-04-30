import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const MONGODB_URI = "mongodb+srv://davidadeniyi269:Moniye@cluster0.zwijmfw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
    try {
        const matches = JSON.parse(fs.readFileSync('scratch/supermart_batch_matches.json', 'utf-8'));
        console.log(`Checking ${matches.length} matches against verification queue`);

        await mongoose.connect(MONGODB_URI);
        
        const PriceUpdate = mongoose.models.PriceUpdate || mongoose.model('PriceUpdate', new mongoose.Schema({
            productId: mongoose.Schema.Types.ObjectId,
            price: Number,
            status: String
        }));

        const productIds = matches.map(m => new mongoose.Types.ObjectId(m.productId));

        const updates = await PriceUpdate.find({
            productId: { $in: productIds },
            status: 'pending'
        }).lean();

        console.log(`Found ${updates.length} pending updates for these products`);

        if (updates.length > 0) {
            const results = updates.map(u => {
                const match = matches.find(m => m.productId === u.productId.toString());
                return {
                    updateId: u._id,
                    productName: match.productName,
                    updatePrice: u.price,
                    supermartPrice: match.price,
                    match: Math.abs(u.price - match.price) < 1
                };
            });
            console.log(JSON.stringify(results, null, 2));
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.connection.close();
    }
}

run();
