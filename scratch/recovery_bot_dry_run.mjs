import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const mongodbUriMatch = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
const mongodbUri = mongodbUriMatch ? mongodbUriMatch[1] : null;

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

const RECOVERY_RULES = [
    {
        name: 'Oil and Gas',
        match: (p) => /fuel|diesel|petrol/i.test(p.name),
        newLocation: 'Oil and Gas, Oyo'
    },
    {
        name: 'Shoprite',
        match: (p) => /shoprite\.ng/i.test(p.imageUrl) || /Maryland Cookies|Dairymaid|Optimax|Four Cousins/i.test(p.name),
        newLocation: 'Shoprite Supermarket, Ibadan'
    },
    {
        name: 'Foodlocker',
        match: (p) => /foodlocker\.com\.ng/i.test(p.imageUrl),
        newLocation: 'Foodlocker, Ibadan'
    },
    {
        name: 'Online',
        match: (p) => /jumia\.com|konga\.com/i.test(p.imageUrl) || p.marketCategory === 'Online',
        newLocation: 'Online'
    },
    {
        name: 'Traditional Markets (Batch Guess)',
        match: (p) => /Combo|elubo|congo|yam/i.test(p.name) && p.createdAt >= new Date('2026-04-26T00:00:00Z'),
        newLocation: 'Oje market,Oje - Oyo' // Keep these in Oje for now as Oje is a market
    }
];

async function dryRun() {
    try {
        await mongoose.connect(mongodbUri);
        
        const products = await Product.find({ storeLocation: 'Oje market,Oje - Oyo' });
        
        const proposedChanges = {};
        let totalProposed = 0;

        for (const p of products) {
            for (const rule of RECOVERY_RULES) {
                if (rule.match(p)) {
                    if (rule.newLocation !== p.storeLocation) {
                        proposedChanges[rule.name] = (proposedChanges[rule.name] || 0) + 1;
                        totalProposed++;
                    }
                    break;
                }
            }
        }
        
        console.log("Recovery Bot Dry Run Results:");
        console.log(`Total corrupted products checked: ${products.length}`);
        console.log(`Total products to be moved: ${totalProposed}`);
        console.log("Breakdown by rule:");
        console.log(JSON.stringify(proposedChanges, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

dryRun();
