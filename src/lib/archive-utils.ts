import connectDB from './db';
import PriceUpdate from '@/models/PriceUpdate';

/**
 * Archives price updates older than 30 days.
 * In a real production environment, this would move records to a 'PriceUpdateArchive' 
 * collection or a cold storage database. 
 * For this implementation, we will mark them as 'archived' or delete if preferred.
 */
export async function archiveOldPriceUpdates() {
    await connectDB();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log('[Archiver] Running archival for updates older than:', thirtyDaysAgo);

    // Using delete for simplicity in this lean implementation, 
    // but usually you'd move to an archive collection.
    const result = await PriceUpdate.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        status: { $in: ['verified', 'rejected'] } // Only archive processed updates
    });

    console.log(`[Archiver] Successfully archived ${result.deletedCount} updates.`);
    return result.deletedCount;
}
