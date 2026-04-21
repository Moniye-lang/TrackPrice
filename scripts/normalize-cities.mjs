/**
 * Migration: Normalize store city values.
 *   - Any city ending in "Oyo"   → "Oyo"
 *   - Any city ending in "Lagos" → "Lagos"
 *   - "Online" and others left untouched
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
const uriMatch = envContent.match(/^MONGODB_URI=(.+)$/m);
const MONGO_URI = uriMatch ? uriMatch[1].trim() : process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('❌  MONGODB_URI not found in .env.local or environment');
    process.exit(1);
}

function normalizeCity(city) {
    if (!city) return city;
    const lower = city.trim().toLowerCase();
    if (lower === 'online') return city.trim();
    if (lower.endsWith('oyo')) return 'Oyo';
    if (lower.endsWith('lagos')) return 'Lagos';
    return city.trim();
}

await mongoose.connect(MONGO_URI);
console.log('✅  Connected to MongoDB');

const db = mongoose.connection.db;
const stores = await db.collection('stores').find({}).toArray();

console.log(`🔍  Found ${stores.length} stores. Normalizing cities...`);

let updated = 0;
for (const store of stores) {
    const normalized = normalizeCity(store.city);
    if (normalized !== store.city) {
        await db.collection('stores').updateOne(
            { _id: store._id },
            { $set: { city: normalized } }
        );
        console.log(`  ✏️  "${store.name}": "${store.city}" → "${normalized}"`);
        updated++;
    }
}

console.log(`\n🎉  Done. ${updated} stores updated, ${stores.length - updated} already correct.`);
await mongoose.disconnect();
