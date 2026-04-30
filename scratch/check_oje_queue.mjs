import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const mongodbUriMatch = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
const mongodbUri = mongodbUriMatch ? mongodbUriMatch[1] : null;

const scrapedProducts = [
  { "name": "Mango - Sheri x5", "price": 950 },
  { "name": "Tomatoes - Quarter Crate", "price": 21500 },
  { "name": "Spinach ~1 kg", "price": 4950 },
  { "name": "Lebanese Bread/Shawarma Bread", "price": 1600 },
  { "name": "Cabbage - White", "price": 1500 },
  { "name": "Beetroot ~1 kg", "price": 4650 },
  { "name": "Pepper - Red x3", "price": 4600 },
  { "name": "Artisan Butchery Beef Mince Meat 500 g", "price": 5120 },
  { "name": "Funtuna Eggs x24", "price": 7280 },
  { "name": "Agege Bread Medium", "price": 700 },
  { "name": "Chi Chicken Drumstick ~1 kg - Frozen", "price": 12230 },
  { "name": "Broccoli", "price": 3980 },
  { "name": "Strawberry Pack", "price": 6500 },
  { "name": "Red Grapes - Seedless", "price": 6000 },
  { "name": "Cheddar Cheese Portion 250 g", "price": 10720 },
  { "name": "French Roll", "price": 1300 },
  { "name": "Tomatoes - Crate", "price": 63000 },
  { "name": "Irish Potatoes ~1 kg", "price": 3100 },
  { "name": "Avocado x2", "price": 1800 },
  { "name": "Lemon - Imported x6", "price": 6000 },
  { "name": "Butter Bread", "price": 2500 },
  { "name": "Tomatoes 1 kg", "price": 3200 },
  { "name": "Pineapple - Cotonou", "price": 1400 },
  { "name": "Mango Palaba x5", "price": 950 },
  { "name": "Bread Roll x12", "price": 1600 },
  { "name": "Chi Chicken Breast ~1 kg - Frozen", "price": 10280 },
  { "name": "Carrot 1 kg", "price": 2450 },
  { "name": "Milk Bread", "price": 2000 },
  { "name": "Apples - Red x10", "price": 3900 },
  { "name": "Ginger x6", "price": 2400 },
  { "name": "Cucumber x3", "price": 1400 },
  { "name": "Mich & Kay Greek Sweetened Yogurt 400 g", "price": 5250 },
  { "name": "Watermelon - Large", "price": 3500 },
  { "name": "Pepper - Green x3", "price": 2800 },
  { "name": "Spring Onions - Bundle", "price": 1500 },
  { "name": "Hamburger Bun x4", "price": 1600 },
  { "name": "Chi Chicken Thigh ~1 kg - Frozen", "price": 8250 },
  { "name": "Artisan Butchery Beef - Boneless 500 g", "price": 5480 },
  { "name": "Kiwi x1", "price": 2500 },
  { "name": "English Pear x5", "price": 4200 },
  { "name": "Parmesan Cheese ~200 g", "price": 10900 },
  { "name": "Hot Dog Roll Plain x6", "price": 1600 },
  { "name": "Dolait Yoghurt Strawberry 500 g", "price": 4050 },
  { "name": "Croissant x1", "price": 2000 },
  { "name": "Spar Classic Bread", "price": 1750 },
];

async function checkOjeQueue() {
    try {
        await mongoose.connect(mongodbUri);
        
        const PriceUpdate = mongoose.models.PriceUpdate || mongoose.model('PriceUpdate', new mongoose.Schema({}, { strict: false }));
        const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

        const pendingUpdates = await PriceUpdate.find({ status: 'pending' }).lean();
        console.log(`Checking ${pendingUpdates.length} pending updates...\n`);

        for (const update of pendingUpdates) {
            const product = await Product.findById(update.productId).lean();
            if (!product || product.storeLocation !== 'Oje market,Oje - Oyo') continue;

            const match = scrapedProducts.find(s => 
                s.name.toLowerCase().includes(product.name.toLowerCase()) || 
                product.name.toLowerCase().includes(s.name.toLowerCase())
            );

            if (match) {
                console.log(`OJE MATCH FOUND for Update ${update._id}:`);
                console.log(`- DB Product: ${product.name} (₦${product.price})`);
                console.log(`- Proposed: ₦${update.price}`);
                console.log(`- Supermart Match: ${match.name} (₦${match.price})`);
                console.log('---');
            }
        }

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkOjeQueue();
