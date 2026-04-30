import mongoose from 'mongoose';

// Load environment variables
try {
    process.loadEnvFile('.env.local');
} catch (e) {
    console.error('Warning: .env.local not found.');
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env.local');
    process.exit(1);
}

const ProductSchema = new mongoose.Schema({
    isUserAdded: { type: Boolean, default: false },
    status: { type: String },
    createdAt: { type: Date }
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        // Define "Today Start" (April 30th, 2026, 00:00:00 local time)
        // Since the current time is 2026-04-30T17:01, we want anything before today.
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        console.log(`Filtering for products created before: ${todayStart.toISOString()}`);

        const query = { 
            $and: [
                { 
                    $or: [
                        { isUserAdded: { $ne: true } },
                        { isUserAdded: { $exists: false } }
                    ]
                },
                { createdAt: { $lt: todayStart } }
            ]
        };

        const targetCount = await Product.countDocuments(query);
        console.log(`Found ${targetCount} products to PERMANENTLY DELETE (non-user-added, created before today).`);

        if (targetCount === 0) {
            console.log('No products to delete. Exiting.');
            process.exit(0);
        }

        console.log(`Deleting ${targetCount} products...`);
        const result = await Product.deleteMany(query);

        console.log(`Successfully deleted ${result.deletedCount} products.`);
        console.log('Database is now cleaned of old non-user-added products.');

    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

run();
