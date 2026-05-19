import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI is not defined.');
    process.exit(1);
}

async function check() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;
        const productsCollection = db.collection('products');

        const products = await productsCollection.find({}).limit(20).toArray();
        console.log('Sample Product Image URLs:');
        for (const p of products) {
            console.log(`- Name: "${p.name}"\n  URL:  "${p.imageUrl}"`);
        }

        const externalCount = await productsCollection.countDocuments({
            $or: [
                { imageUrl: { $regex: '^http' } },
                { imageUrl: { $regex: '^//' } }
            ]
        });
        console.log(`Total products: ${await productsCollection.countDocuments({})}`);
        console.log(`Products with http/https or // (external): ${externalCount}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
