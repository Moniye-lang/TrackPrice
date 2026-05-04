import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({
            storeLocation: String,
            storeId: mongoose.Schema.Types.ObjectId
        }));
        const count = await Product.countDocuments({ 
            storeLocation: 'Oje market,Oje - Oyo', 
            storeId: { $ne: null } 
        });
        console.log('Products in Oje with storeId:', count);
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.connection.close();
    }
}
run();
