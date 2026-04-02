const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
        }
    });
}

const standardCategories = [
    'Groceries', 'Beverages', 'Electronics', 'Clothing', 'Home', 
    'Health & Beauty', 'Books', 'Oil and Gas', 'Building Materials', 'Other'
];

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB...');

        const ProductSchema = new mongoose.Schema({
            name: String,
            category: String
        }, { collection: 'products' });
        
        const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

        const products = await Product.find({});
        console.log(`Analyzing ${products.length} products to normalize categories...`);
        
        let updatedCount = 0;

        for (const p of products) {
            let cat = p.category;
            
            // Safeguard if category is somehow falsely
            if (!cat) cat = '';
            
            const originalCat = cat;
            const normCat = cat.toLowerCase().trim();

            let newCat = '';

            if (normCat === 'drink' || normCat === 'drinks') {
                newCat = 'Beverages';
            } else if (normCat === 'canned' || normCat === 'can food') {
                newCat = 'Groceries';
            } else if (normCat === 'frozen foods' || normCat === 'food' || normCat === 'snacks' || normCat === 'junk') {
                newCat = 'Groceries';
            } else if (normCat === 'fresh produce') {
                newCat = 'Groceries';
            } else if (normCat === 'groceries') {
                newCat = 'Groceries'; // Fix trailing spaces
            } else if (normCat === 'oil and gas') {
                newCat = 'Oil and Gas';
            } else if (normCat === 'toiletries') {
                newCat = 'Health & Beauty';
            } else if (normCat === 'building material' || normCat === 'building materials') {
                newCat = 'Building Materials';
            } else if (normCat === 'electronic' || normCat === 'electronics') {
                newCat = 'Electronics';
            } else if (normCat === 'uncategorized' || normCat === 'other' || normCat === 'all' || normCat === '') {
                // Heuristic analysis based on product name
                const nameLower = p.name ? p.name.toLowerCase() : '';
                
                const drKeywords = ['drink', 'water', 'fayrouz', 'schweppes', 'coca', 'fanta', 'sprite', 'beer', 'juice', 'malt', 'wine', 'gin', 'vodka'];
                const grocKeywords = ['rice', 'beans', 'garri', 'yam', 'egg', 'bread', 'oil', 'chicken', 'beef', 'fish', 'tomato', 'pepper', 'onion', 'maggi', 'salt', 'sugar', 'spaghetti', 'indomie', 'noodles', 'milk', 'corn', 'sweet corn', 'snickers', 'alpenliebe', 'pringles', 'chocolate'];
                const clothKeywords = ['shirt', 'shoe', 'sneaker', 'dress', 'trouser', 'jeans', 'bag', 'polo', 'suit', 'watch'];
                const hbKeywords = ['soap', 'cream', 'pomade', 'lotion', 'perfume', 'deodorant', 'toothpaste', 'brush', 'shampoo', 'conditioner', 'detergent', 'sanitizer', 'viva'];
                const buildKeywords = ['cement', 'block', 'sand', 'gravel', 'nail', 'wood', 'plank', 'iron', 'rod'];
                
                if (drKeywords.some(k => nameLower.includes(k))) newCat = 'Beverages';
                else if (grocKeywords.some(k => nameLower.includes(k))) newCat = 'Groceries';
                else if (clothKeywords.some(k => nameLower.includes(k))) newCat = 'Clothing';
                else if (hbKeywords.some(k => nameLower.includes(k))) newCat = 'Health & Beauty';
                else if (buildKeywords.some(k => nameLower.includes(k))) newCat = 'Building Materials';
                else newCat = 'Other';
            } else {
                // If the category is perfectly matched with one of standard categories
                if (standardCategories.includes(cat.trim())) {
                    newCat = cat.trim(); 
                } else if (standardCategories.map(c=>c.toLowerCase()).includes(normCat)) {
                    // Match standard capitalization
                    newCat = standardCategories.find(c => c.toLowerCase() === normCat);
                } else {
                    newCat = 'Other';
                }
            }

            if (newCat !== originalCat) {
                p.category = newCat;
                await p.save();
                updatedCount++;
                console.log(`Updated: "${p.name}" | [Old: '${originalCat}'] -> [New: '${newCat}']`);
            }
        }
        
        console.log(`\nNormalization complete! Modified ${updatedCount} products.`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
