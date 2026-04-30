import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Load environment variables using built-in Node.js functionality
try {
    process.loadEnvFile('.env.local');
} catch (e) {
    console.error('Warning: .env.local not found or process.loadEnvFile not supported.');
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env.local');
    process.exit(1);
}

// Define Schema manually to avoid model registration issues in a standalone script
const ProductSchema = new mongoose.Schema({
    isUserAdded: { type: Boolean, default: false },
    status: { type: String },
    storeLocation: { type: String }
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        // 1. FULL BACKUP
        console.log('Fetching all products for full backup...');
        const allProducts = await Product.find({}).lean();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join('backups', `full_products_backup_${timestamp}.json`);
        
        fs.writeFileSync(backupPath, JSON.stringify(allProducts, null, 2));
        console.log(`Full backup created at ${backupPath} (${allProducts.length} products).`);

        // 2. IDENTIFY PRODUCTS TO SOFT DELETE
        // We target products where isUserAdded is NOT true.
        const query = { 
            $or: [
                { isUserAdded: { $ne: true } },
                { isUserAdded: { $exists: false } }
            ]
        };

        const targetProducts = await Product.find(query).lean();
        console.log(`Found ${targetProducts.length} products that are NOT user-added.`);

        if (targetProducts.length === 0) {
            console.log('No products to soft-delete. Exiting.');
            process.exit(0);
        }

        // 3. PERFORM SOFT DELETE (Update status to 'rejected')
        console.log('Performing soft delete (setting status to "rejected")...');
        const result = await Product.updateMany(query, { 
            $set: { status: 'rejected' } 
        });

        console.log(`Successfully updated ${result.modifiedCount} products.`);
        console.log('Cleanup complete.');

    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

run();
