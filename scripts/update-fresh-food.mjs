import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// 1. Load Environment Variables
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const mongodbUriMatch = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
const mongodbUri = mongodbUriMatch ? mongodbUriMatch[1] : null;

// 2. Setup Mongoose Schema
const ProductSchema = new mongoose.Schema({ name: String, category: String }, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// 3. Execution Logic
async function updateFreshFood() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(mongodbUri);

        // Find products with "(paint)" or "(half paint)" in the name, case-insensitive
        const query = {
            name: { $regex: /\(paint\)|\(half paint\)/i }
        };

        const matchingProducts = await Product.find(query);
        console.log(`Found ${matchingProducts.length} products matching '(paint)' or '(half paint)'.`);

        if (matchingProducts.length > 0) {
            const result = await Product.updateMany(query, { $set: { category: 'Fresh Food' } });
            console.log(`Successfully updated ${result.modifiedCount} products to 'Fresh Food' category.`);
        }

    } catch (err) {
        console.error('Error during update:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

updateFreshFood();
