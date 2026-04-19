/**
 * Migration: Rename "Ibadan" → "Oyo" in:
 *   - stores.city
 *   - areas.state (if any have "Ibadan" instead of "Oyo")
 *   - products.storeLocation (text field that may contain "Ibadan")
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Load MONGODB_URI from .env.local manually (no dotenv dep required)
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
const uriMatch = envContent.match(/^MONGODB_URI=(.+)$/m);
const MONGO_URI = uriMatch ? uriMatch[1].trim() : process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('❌  MONGODB_URI not found in .env.local or environment');
    process.exit(1);
}

await mongoose.connect(MONGO_URI);
console.log('✅  Connected to MongoDB');

const db = mongoose.connection.db;

// 1. Stores: city = "Ibadan" → "Oyo"
const storeResult = await db.collection('stores').updateMany(
    { city: 'Ibadan' },
    { $set: { city: 'Oyo' } }
);
console.log(`🏪  Stores updated: ${storeResult.modifiedCount}`);

// 2. Areas: state = "Ibadan" → "Oyo" (safety net)
const areaResult = await db.collection('areas').updateMany(
    { state: 'Ibadan' },
    { $set: { state: 'Oyo' } }
);
console.log(`📍  Areas updated: ${areaResult.modifiedCount}`);

// 3. Products: storeLocation containing "Ibadan" → replace with "Oyo"
const products = await db.collection('products').find({
    storeLocation: { $regex: 'Ibadan', $options: 'i' }
}).toArray();

let productCount = 0;
for (const p of products) {
    const updated = p.storeLocation.replace(/Ibadan/gi, 'Oyo');
    await db.collection('products').updateOne(
        { _id: p._id },
        { $set: { storeLocation: updated } }
    );
    productCount++;
}
console.log(`📦  Products updated: ${productCount}`);

await mongoose.disconnect();
console.log('🎉  Migration complete. All "Ibadan" → "Oyo".');
