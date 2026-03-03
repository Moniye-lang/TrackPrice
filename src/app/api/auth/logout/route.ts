import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
    const cookie = serialize('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0),
        path: '/',
    });

    return NextResponse.json(
        { message: 'Logged out' },
        {
            status: 200,
            headers: { 'Set-Cookie': cookie },
        }
    );
}
