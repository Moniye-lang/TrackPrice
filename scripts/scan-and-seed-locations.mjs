/**
 * scan-and-seed-locations.mjs
 * 
 * Scans the database for all unique cities/areas from:
 *   - Store.city  (structured)
 *   - Store.area  (structured)
 *   - Product.storeLocation (legacy freetext)
 * 
 * Then classifies each as Oyo or Lagos and upserts into the Area collection.
 * 
 * Run with:
 *   node --env-file=.env.local scripts/scan-and-seed-locations.mjs
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set. Run with: node --env-file=.env.local scripts/scan-and-seed-locations.mjs');
    process.exit(1);
}

// ── Minimal Schemas ──────────────────────────────────────────────────────────

const StoreSchema = new mongoose.Schema({
    name: String,
    area: String,
    city: String,
});
const ProductSchema = new mongoose.Schema({
    storeLocation: String,
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    status: String,
    marketCategory: String,
});
const AreaSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        state: { type: String, required: true, enum: ['Oyo', 'Lagos'] },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);
AreaSchema.index({ name: 1, state: 1 }, { unique: true });

const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const Area = mongoose.models.Area || mongoose.model('Area', AreaSchema);

// ── Helpers ──────────────────────────────────────────────────────────────────

function classifyState(text) {
    if (!text) return null;
    const l = text.toLowerCase().trim();
    if (l === 'online') return null; // Skip online

    if (
        l.includes('oyo') || l.includes('ibadan') || l.includes('bodija') ||
        l.includes('dugbe') || l.includes('oja') || l.includes('agodi') ||
        l.includes('iwo') || l.includes('ogbomoso') || l.includes('ringroad') ||
        l.includes('ring road') || l.includes('mokola') || l.includes('challenge') ||
        l.includes('beere') || l.includes('oluyole') || l.includes('iyaganku') ||
        l.startsWith('iba')
    ) return 'Oyo';

    if (
        l.includes('lagos') || l.includes('ikeja') || l.includes('lekki') ||
        l.includes('vi ') || l.includes('victoria island') || l.includes('surulere') ||
        l.includes('yaba') || l.includes('alimosho') || l.includes('berger') ||
        l.includes('ikorodu') || l.includes('ajah') || l.includes('oshodi') ||
        l.includes('mushin') || l.includes('agege') || l.includes('eko') ||
        l.startsWith('ike') || l.startsWith('lek')
    ) return 'Lagos';

    return null;
}

function normalizeAreaName(text) {
    // Title-case the area name
    return text.trim().replace(/\b\w/g, c => c.toUpperCase());
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const discovered = new Map(); // "Name|State" -> { name, state }

    // 1. Scan Stores ─────────────────────────────────────────────────────────
    console.log('📦 Scanning Stores...');
    const stores = await Store.find({}).lean();
    console.log(`   Found ${stores.length} stores.`);

    for (const store of stores) {
        // city field
        if (store.city) {
            const state = classifyState(store.city);
            if (state) {
                const name = normalizeAreaName(store.city.replace(/(oyo|lagos)/gi, '').trim() || store.city);
                const key = `${name}|${state}`;
                if (!discovered.has(key)) discovered.set(key, { name, state });
            }
        }

        // area field
        if (store.area) {
            const state = classifyState(store.city) || classifyState(store.area);
            if (state) {
                const name = normalizeAreaName(store.area);
                const key = `${name}|${state}`;
                if (!discovered.has(key)) discovered.set(key, { name, state });
            }
        }
    }

    // 2. Scan Product.storeLocation (legacy text) ───────────────────────────
    console.log('\n📦 Scanning Products (storeLocation)...');
    const locations = await Product.distinct('storeLocation', {
        storeLocation: { $ne: null, $exists: true }
    });
    console.log(`   Found ${locations.length} unique storeLocation values.`);

    for (const loc of locations) {
        if (!loc || loc.trim() === '') continue;
        const state = classifyState(loc);
        if (state) {
            // Extract the area name: last comma-separated segment
            const parts = loc.split(',').map(p => p.trim()).filter(Boolean);
            const areaName = parts.length > 1 ? parts[parts.length - 2] : parts[0];
            if (!areaName) continue;
            const name = normalizeAreaName(areaName);
            const key = `${name}|${state}`;
            if (!discovered.has(key)) discovered.set(key, { name, state });
        }
    }

    // 3. Print findings ───────────────────────────────────────────────────────
    const entries = Array.from(discovered.values()).sort((a, b) =>
        a.state.localeCompare(b.state) || a.name.localeCompare(b.name)
    );

    console.log(`\n🗺️  Discovered ${entries.length} unique locations:\n`);
    const oyoEntries = entries.filter(e => e.state === 'Oyo');
    const lagosEntries = entries.filter(e => e.state === 'Lagos');

    if (oyoEntries.length) {
        console.log('  Oyo:');
        oyoEntries.forEach(e => console.log(`    - ${e.name}`));
    }
    if (lagosEntries.length) {
        console.log('  Lagos:');
        lagosEntries.forEach(e => console.log(`    - ${e.name}`));
    }

    // 4. Upsert into Area collection ─────────────────────────────────────────
    console.log('\n⬆️  Upserting into Area collection...');
    let inserted = 0, skipped = 0;

    for (const { name, state } of entries) {
        try {
            const result = await Area.updateOne(
                { name, state },
                { $setOnInsert: { name, state, isActive: true } },
                { upsert: true }
            );
            if (result.upsertedCount > 0) {
                console.log(`   ✅ Added: ${name} (${state})`);
                inserted++;
            } else {
                skipped++;
            }
        } catch (err) {
            console.warn(`   ⚠️  Skipped "${name}" (${state}): ${err.message}`);
        }
    }

    console.log(`\n🎉 Done! Added ${inserted} new areas, ${skipped} already existed.`);
    await mongoose.disconnect();
}

main().catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
});
