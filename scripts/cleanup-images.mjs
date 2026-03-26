import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Read .env.local to get MONGODB_URI
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

// 2. Define minimal Product schema
const ProductSchema = new mongoose.Schema({
    name: String,
    imageUrl: String,
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function cleanup() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongodbUri);
        console.log('Connected successfully.');

        // Find products with "generated" images
        // We look for placehold.co, loremflickr, or other known inaccurate sources
        const query = {
            $or: [
                { imageUrl: { $regex: 'placehold\\.co', $options: 'i' } },
                { imageUrl: { $regex: 'loremflickr\\.com', $options: 'i' } },
                { imageUrl: { $regex: 'encrypted-tbn0\\.gstatic\\.com', $options: 'i' } }, // Google image results
                { imageUrl: { $regex: 'supermart\\.ng', $options: 'i' } }, // Old scraping strategy
                { imageUrl: { $regex: 'openfoodfacts\\.org', $options: 'i' } }, // Old scraping strategy
                { imageUrl: { $regex: 'wikimedia\\.org', $options: 'i' } }, // Old scraping strategy
                { imageUrl: 'undefined' },
                { imageUrl: 'null' }
            ]
        };

        const count = await Product.countDocuments(query);
        console.log(`Found ${count} products with inaccurate generated images.`);

        if (count === 0) {
            console.log('No products to clean up.');
            process.exit(0);
        }

        const result = await Product.updateMany(query, { $set: { imageUrl: '' } });
        console.log(`Successfully updated ${result.modifiedCount} products.`);

        // Also check for products where imageUrl is just the product name (failed scrapes)
        // Harder to regex, so we'll just stick to the known patterns for now.

    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

cleanup();
