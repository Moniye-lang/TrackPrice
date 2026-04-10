import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import AuditLog from '@/models/AuditLog';
import { isServerAdmin, getServerUser } from '@/lib/server-auth';

async function isAdmin() {
    return await isServerAdmin();
}

export async function GET(req: Request) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const action = searchParams.get('action');

        const query: any = {};
        if (action) query.action = action;

        const logs = await AuditLog.find(query)
            .populate('adminId', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const total = await AuditLog.countDocuments(query);

        return NextResponse.json({
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error: any) {
        console.error('[Audit Log API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    // This can be used for manual log entry if needed, but mostly triggered internally
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectDB();
        const body = await req.json();
        const user = await getServerUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const log = await AuditLog.create({
            adminId: user.id,
            action: body.action,
            details: body.details
        });

        return NextResponse.json(log);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create log' }, { status: 400 });
    }
}
