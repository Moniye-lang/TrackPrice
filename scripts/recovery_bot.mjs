import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const mongodbUriMatch = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
const mongodbUri = mongodbUriMatch ? mongodbUriMatch[1] : null;

const ProductSchema = new mongoose.Schema({
    storeId: mongoose.Schema.Types.ObjectId,
    storeLocation: String,
    imageUrl: String,
    name: String,
}, { timestamps: true, strict: false });

const StoreSchema = new mongoose.Schema({
    name: String,
    area: String,
    city: String
}, { timestamps: true, strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);

async function runRecovery(dryRun = true) {
    try {
        await mongoose.connect(mongodbUri);
        const targetLocation = 'Oje market,Oje - Oyo';
        
        console.log('Fetching stores...');
        const stores = await Store.find({});
        const storeMap = {};
        stores.forEach(s => {
            storeMap[s._id.toString()] = `${s.name} (${s.area}, ${s.city})`;
        });

        console.log(`Fetching products in ${targetLocation}...`);
        const products = await Product.find({ storeLocation: targetLocation });
        console.log(`Analyzing ${products.length} products...`);

        const stats = {
            total: products.length,
            restoredViaStoreId: 0,
            restoredViaHeuristics: 0,
            remaining: 0,
            breakdown: {}
        };

        const updates = [];

        // Define keyword-to-location mapping
        const keywordMap = [
            { kw: 'shoprite', loc: 'Shoprite (Palms Mall) (Dugbe, Oyo)' },
            { kw: 'bovas', loc: 'Bovas Filling Station (Ibadan, Oyo)' },
            { kw: 'foodlocker', loc: 'Foodlocker (Ibadan, Oyo)' },
            { kw: '24hoursmarket', loc: '24Hours Market (Ibadan, Oyo)' },
            { kw: 'gomarket', loc: 'GoMarket (Ibadan, Oyo)' },
            { kw: 'pricepally', loc: 'PricePally (Ibadan, Oyo)' },
            { kw: 'foodco', loc: 'FoodCo (Bodija) (Bodija, Oyo)' },
            { kw: 'ace supermarket', loc: 'Ace Supermarket (Bodija) (Bodija, Oyo)' },
            { kw: 'spar', loc: 'Spar (Lekki Phase 1, Lagos)' },
            { kw: 'bodija', loc: 'Bodija Market (Bodija, Oyo)' },
            { kw: 'dugbe', loc: 'Dugbe Market (Dugbe, Oyo)' },
        ];

        for (const p of products) {
            let newLocation = null;

            // 1. Check storeId
            if (p.storeId && storeMap[p.storeId.toString()]) {
                newLocation = storeMap[p.storeId.toString()];
                stats.restoredViaStoreId++;
            }

            // 2. Check heuristics (Name and ImageURL)
            if (!newLocation) {
                const combinedText = `${p.name || ''} ${p.imageUrl || ''}`.toLowerCase();
                
                // Exclude placeholders from URL analysis but keep name analysis
                const isPlaceholder = p.imageUrl && p.imageUrl.includes('placehold');
                const textToSearch = isPlaceholder ? (p.name || '').toLowerCase() : combinedText;

                for (const rule of keywordMap) {
                    if (textToSearch.includes(rule.kw)) {
                        newLocation = rule.loc;
                        stats.restoredViaHeuristics++;
                        break;
                    }
                }
            }

            if (newLocation) {
                stats.breakdown[newLocation] = (stats.breakdown[newLocation] || 0) + 1;
                updates.push({ id: p._id, location: newLocation });
            } else {
                stats.remaining++;
            }
        }

        console.log('\nRecovery Stats:');
        console.log(JSON.stringify(stats, null, 2));

        if (!dryRun && updates.length > 0) {
            console.log(`\nExecuting ${updates.length} updates...`);
            const bulkOps = updates.map(u => ({
                updateOne: {
                    filter: { _id: u.id },
                    update: { $set: { storeLocation: u.location } }
                }
            }));

            const chunkSize = 500;
            for (let i = 0; i < bulkOps.length; i += chunkSize) {
                const chunk = bulkOps.slice(i, i + chunkSize);
                await Product.bulkWrite(chunk);
                console.log(`Progress: ${i + chunk.length} / ${updates.length}`);
            }
            console.log('Update complete.');
        } else {
            console.log('\nDRY RUN: No changes made to database.');
        }

    } catch (error) {
        console.error('Recovery failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

const isDryRun = process.argv.includes('--execute') ? false : true;
runRecovery(isDryRun);
