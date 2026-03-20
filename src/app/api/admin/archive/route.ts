import { NextResponse } from 'next/server';
import { archiveOldPriceUpdates } from '@/lib/archive-utils';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import User from '@/models/User';

export async function POST() {
    try {
        const token = (await cookies()).get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await User.findById((decoded as any).id);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
