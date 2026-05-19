import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI is not defined. Run this script with node --env-file=.env.local scripts/migrate-images-db.mjs');
    process.exit(1);
}

function cleanAndNormalizeImageUrl(imgUrl, sourceUrl) {
    if (!imgUrl) return '';
    let url = imgUrl.trim();
    if (url.startsWith('data:image')) return '';

    // If it's protocol-relative (starts with '//')
    if (url.startsWith('//')) {
        return `https:${url}`;
    }

    // If it's already an absolute URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
        // Fix duplicate/concatenated protocols like https://trackpricely.com/https://cdn.sanity.io/...
        const duplicateSchemeMatch = url.match(/https?:\/\/[^/]+\/(https?:\/\/.*)/);
        if (duplicateSchemeMatch) {
            return duplicateSchemeMatch[1];
        }
        return url;
    }

    try {
        const parsedSource = new URL(sourceUrl);
        if (url.startsWith('/')) {
            return `${parsedSource.origin}${url}`;
        }
        // Relative path, resolve it relative to base directory of sourceUrl
        const basePath = parsedSource.pathname.substring(0, parsedSource.pathname.lastIndexOf('/') + 1);
        return `${parsedSource.origin}${basePath}${url}`;
    } catch (e) {
        return url;
    }
}

async function runMigration() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB successfully.');

        const db = mongoose.connection.db;
        const productsCollection = db.collection('products');

        const products = await productsCollection.find({}).toArray();
        console.log(`Found ${products.length} products to process.`);

        let updatedCount = 0;

        for (const product of products) {
            const originalUrl = product.imageUrl || '';
            let cleanedUrl = cleanAndNormalizeImageUrl(originalUrl, '');

            // Also check for duplicate/concatenated hostnames: e.g. https://trackpricely.com/https://... or similar
            if (cleanedUrl.includes('trackpricely.com/http')) {
                const idx = cleanedUrl.indexOf('trackpricely.com/');
                const remaining = cleanedUrl.substring(idx + 'trackpricely.com/'.length);
                if (remaining.startsWith('http')) {
                    cleanedUrl = remaining;
                }
            }

            if (cleanedUrl !== originalUrl) {
                console.log(`Updating product "${product.name}":\n  Old: ${originalUrl}\n  New: ${cleanedUrl}\n`);
                await productsCollection.updateOne(
                    { _id: product._id },
                    { $set: { imageUrl: cleanedUrl } }
                );
                updatedCount++;
            }
        }

        console.log(`Migration complete. Checked ${products.length} products. Updated ${updatedCount} products.`);

    } catch (err) {
        console.error('Error during migration:', err);
    } finally {
        await mongoose.disconnect();
    }
}

runMigration();
