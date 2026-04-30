import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const mongodbUriMatch = envContent.match(/MONGODB_URI=["']?([^"'\s\n]+)["']?/);
const mongodbUri = mongodbUriMatch ? mongodbUriMatch[1] : null;

if (!mongodbUri) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
}

async function runBackup() {
    try {
        await mongoose.connect(mongodbUri);
        console.log('Connected to MongoDB...');

        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(process.cwd(), 'backups', timestamp);

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        console.log(`Starting backup to ${backupDir}...`);

        for (const name of collectionNames) {
            console.log(`Backing up collection: ${name}...`);
            const data = await mongoose.connection.db.collection(name).find({}).toArray();
            const filePath = path.join(backupDir, `${name}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`- Saved ${data.length} documents to ${name}.json`);
        }

        console.log('\nBackup complete successfully!');
        console.log(`Location: ${backupDir}`);

    } catch (error) {
        console.error('Backup failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runBackup();
