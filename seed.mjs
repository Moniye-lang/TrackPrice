import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI is not defined.');
    console.log('Please run with: node --env-file=.env.local seed.mjs');
    process.exit(1);
}

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String, required: true },
    lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

const DUMMY_PRODUCTS = [
    {
        name: 'iPhone 15 Pro',
        price: 1200000,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=1000&auto=format&fit=crop',
    },
    {
        name: 'MacBook Air M2',
        price: 950000,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1517336714467-d23784a3e8cc?q=80&w=1000&auto=format&fit=crop',
    },
    {
        name: 'Nike Air Max',
        price: 85000,
        category: 'Clothing',
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop',
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const count = await Product.countDocuments();
        if (count === 0) {
            console.log('Seeding products...');
            await Product.insertMany(DUMMY_PRODUCTS);
            console.log('Products seeded successfully!');
        } else {
            console.log(`Database already has ${count} products. Skipping seed.`);
        }

    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
