import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith('/admin')) {
        // Exclude /admin/login from protection
        if (pathname === '/admin/login') {
            return NextResponse.next();
        }

        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        try {
            // Standardize on using the same secret logic as lib/auth
            const secret = process.env.JWT_SECRET || 'fallback_secret';
            const encodedSecret = new TextEncoder().encode(secret);
            const { payload } = await jwtVerify(token, encodedSecret);

            if (payload.role !== 'admin') {
                console.warn('[Middleware] Unauthorized admin access attempt:', payload.email);
                return NextResponse.redirect(new URL('/', request.url));
            }
            return NextResponse.next();
        } catch (error) {
            console.error('Middleware JWT Error:', error);
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
