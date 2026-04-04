import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Redirect old /admin path to new management-gate
    if (pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/management-gate/dashboard', request.url));
    }

    if (pathname.startsWith('/management-gate') || pathname.startsWith('/api/admin')) {
        const isApi = pathname.startsWith('/api/admin');
        const loginPath = isApi ? null : '/management-gate/login';

        // Exclude frontend login from protection
        if (!isApi && pathname === loginPath) {
            return NextResponse.next();
        }

        const token = request.cookies.get('admin_token')?.value;

        if (!token) {
            if (isApi) {
                return NextResponse.json({ error: 'Unauthorized API access' }, { status: 401 });
            }
            return NextResponse.redirect(new URL(loginPath!, request.url));
        }

        try {
            const secret = process.env.JWT_SECRET || 'fallback_secret';
            const encodedSecret = new TextEncoder().encode(secret);
            const { payload } = await jwtVerify(token, encodedSecret);

            if (payload.role !== 'admin') {
                console.warn('[Middleware] Unauthorized admin access attempt:', payload.email);
                if (isApi) {
                    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
                }
                return NextResponse.redirect(new URL('/', request.url));
            }
            return NextResponse.next();
        } catch (error) {
            console.error('Middleware JWT Error:', error);
            if (isApi) {
                return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
            }
            return NextResponse.redirect(new URL(loginPath!, request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/management-gate/:path*', '/admin/:path*', '/api/admin/:path*'],
};
