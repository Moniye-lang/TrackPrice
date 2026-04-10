import { NextResponse } from 'next/server';
import { archiveOldPriceUpdates } from '@/lib/archive-utils';
import { isServerAdmin } from '@/lib/server-auth';

export async function POST() {
    try {
        if (!(await isServerAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const count = await archiveOldPriceUpdates();
        return NextResponse.json({
            success: true,
            message: `Archived ${count} updates.`,
            count
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
