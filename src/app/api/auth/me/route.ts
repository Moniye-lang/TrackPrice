import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET() {
    const token = (await cookies()).get('token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
        return NextResponse.json({ error: 'Auth failed' }, { status: 401 });
    }

    return NextResponse.json({ user: payload });
}
