import mongoose from 'mongoose';
import fs from 'fs';
import 'dotenv/config';
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    try {
        const supermartProducts = JSON.parse(fs.readFileSync('scratch/supermart_products.json', 'utf-8'));
        console.log(`Loaded ${supermartProducts.length} products from Supermart.ng`);

        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({
            name: String,
            storeLocation: String,
            price: Number
        }));

        const ojeProducts = await Product.find({ storeLocation: 'Oje market,Oje - Oyo' }).lean();
        console.log(`Found ${ojeProducts.length} products in Oje Market`);

        const matches = [];
        for (const sp of supermartProducts) {
            // Find products in Oje Market with same name (case-insensitive) and price
            const found = ojeProducts.filter(p => 
                p.name.toLowerCase() === sp.name.toLowerCase() && 
                Math.abs(p.price - sp.price) < 1 // Account for rounding
            );

            if (found.length > 0) {
                for (const f of found) {
                    matches.push({
                        productId: f._id,
                        productName: f.name,
                        price: f.price,
                        newLocation: 'Supermart.ng (Fresh Food)'
                    });
                }
            }
        }

        console.log(`Found ${matches.length} matches!`);
        if (matches.length > 0) {
            fs.writeFileSync('scratch/supermart_matches.json', JSON.stringify(matches, null, 2));
            console.log("Matches saved to scratch/supermart_matches.json");
            
            // Show some matches
            console.log("Sample matches:");
            console.log(JSON.stringify(matches.slice(0, 5), null, 2));
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.connection.close();
    }
}

run();
