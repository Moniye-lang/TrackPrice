import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET() {
    const token = (await cookies()).get('token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyToken(token) as any;
    if (!payload || !payload.id) {
        return NextResponse.json({ error: 'Auth failed' }, { status: 401 });
    }

    const { id } = payload;
    await connectDB();
    const user = await User.findById(id).select('-password').lean();

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
}
