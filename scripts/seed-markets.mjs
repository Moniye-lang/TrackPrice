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

// 2. Define Store schema
const StoreSchema = new mongoose.Schema({
    name: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    type: { type: String, enum: ['Supermarket', 'Market', 'Store'], default: 'Store' },
    imageUrl: String,
}, { timestamps: true });

const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);

const ibadanStores = [
    { name: 'Bodija Market', area: 'Bodija', city: 'Ibadan', type: 'Market' },
    { name: 'Dugbe Market', area: 'Dugbe', city: 'Ibadan', type: 'Market' },
    { name: 'Oja\'ba Market', area: 'Oja\'ba', city: 'Ibadan', type: 'Market' },
    { name: 'Agbeni Market', area: 'Agbeni', city: 'Ibadan', type: 'Market' },
    { name: 'Iwo Road Market', area: 'Iwo Road', city: 'Ibadan', type: 'Market' },
    { name: 'Gbagi Market', area: 'Old-Ife Road', city: 'Ibadan', type: 'Market' },
    { name: 'Mokola Market', area: 'Mokola', city: 'Ibadan', type: 'Market' },
    { name: 'Sango Market', area: 'Sango', city: 'Ibadan', type: 'Market' },
    { name: 'Apata Market', area: 'Apata', city: 'Ibadan', type: 'Market' },
    { name: 'Challenge Market', area: 'Challenge', city: 'Ibadan', type: 'Market' },
    { name: 'Eleyele Market', area: 'Eleyele', city: 'Ibadan', type: 'Market' },
    { name: 'Ojoo Market', area: 'Ojoo', city: 'Ibadan', type: 'Market' },
    { name: 'Moniya Market', area: 'Moniya', city: 'Ibadan', type: 'Market' },
    { name: 'Akinyele Market', area: 'Akinyele', city: 'Ibadan', type: 'Market' },
    { name: 'Idi-Ayunre Market', area: 'Oluyole', city: 'Ibadan', type: 'Market' },
    { name: 'Shoprite (Heritage Mall)', area: 'Dugbe', city: 'Ibadan', type: 'Supermarket' },
    { name: 'Shoprite (Palms Mall)', area: 'Ring Road', city: 'Ibadan', type: 'Supermarket' },
    { name: 'Ventura Mall', area: 'Samonda', city: 'Ibadan', type: 'Supermarket' },
    { name: 'FoodCo (Bodija)', area: 'Bodija', city: 'Ibadan', type: 'Supermarket' },
    { name: 'FoodCo (Akobo)', area: 'Akobo', city: 'Ibadan', type: 'Supermarket' },
    { name: 'Ace Supermarket (Bodija)', area: 'Bodija', city: 'Ibadan', type: 'Supermarket' },
    { name: 'Ace Supermarket (Ring Road)', area: 'Ring Road', city: 'Ibadan', type: 'Supermarket' },
    { name: 'Feather Lite Market', area: 'Bashorun', city: 'Ibadan', type: 'Market' },
];

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongodbUri);
        console.log('Connected successfully.');

        console.log(`Seeding ${ibadanStores.length} stores...`);
        
        for (const storeData of ibadanStores) {
            // Check if exists
            const existing = await Store.findOne({ name: storeData.name, area: storeData.area });
            if (!existing) {
                await Store.create(storeData);
                console.log(`Created: ${storeData.name}`);
            } else {
                console.log(`Skipped (already exists): ${storeData.name}`);
            }
        }

        console.log('Seeding completed.');

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seed();
