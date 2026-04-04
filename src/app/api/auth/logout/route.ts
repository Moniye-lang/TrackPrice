import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
    const response = NextResponse.json({ message: 'Logged out' });

    response.cookies.set('admin_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0),
        path: '/',
    });

    response.cookies.set('user_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0),
        path: '/',
    });

    return response;
}
