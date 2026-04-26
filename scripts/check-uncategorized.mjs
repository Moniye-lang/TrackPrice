import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const mongodbUriMatch = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
const mongodbUri = mongodbUriMatch ? mongodbUriMatch[1] : null;

const ProductSchema = new mongoose.Schema({ name: String, category: String }, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function check() {
    await mongoose.connect(mongodbUri);
    const count = await Product.countDocuments({ category: 'Uncategorized' });
    const samples = await Product.find({ category: 'Uncategorized' }).select('name').limit(30);
    console.log('Uncategorized count:', count);
    console.log('Samples:');
    samples.forEach(s => console.log(' - ' + s.name));
    await mongoose.disconnect();
}
check();
