import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Message from './src/models/Message.ts';
import User from './src/models/User.ts';
import Product from './src/models/Product.ts';

dotenv.config({ path: '.env.local' });

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to DB');
        const messages = await Message.find({ productId: { $exists: false } })
            .populate('productId', 'name price maxPrice')
            .populate('userId', 'name')
            .sort({ createdAt: -1 });
        console.log('Successfully fetched', messages.length, 'messages');
    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        await mongoose.disconnect();
    }
}

test();
