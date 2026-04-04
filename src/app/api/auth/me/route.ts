import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET() {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token')?.value;
    const userToken = cookieStore.get('user_token')?.value;

    const token = adminToken || userToken;

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
