import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI is not defined.');
    process.exit(1);
}

async function fix() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        const productsCollectionExists = collections.some(c => c.name === 'products');

        if (productsCollectionExists) {
            const collection = mongoose.connection.db.collection('products');
            const indexes = await collection.indexes();
            console.log('Current indexes:', indexes.map(i => i.name));

            if (indexes.some(i => i.name === 'slug_1')) {
                console.log('Dropping slug_1 index...');
                await collection.dropIndex('slug_1');
                console.log('Index dropped successfully!');
            } else {
                console.log('slug_1 index not found.');
            }
        } else {
            console.log('Products collection not found.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

fix();
