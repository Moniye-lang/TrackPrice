'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui-base';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            // Skip auth check on login page
            if (pathname === '/admin/login') {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) {
                    router.push('/admin/login');
                } else {
                    setLoading(false);
                }
            } catch (error) {
                router.push('/admin/login');
            }
        };
        checkAuth();
    }, [router, pathname]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">TrackPrice Admin</h2>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href="/admin/dashboard"
                        className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
                    >
                        Products
                    </Link>
                    <Link
                        href="/admin/messages"
                        className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
                    >
                        Forum Messages
                    </Link>
                </nav>
                <div className="p-4 border-t">
                    <Button variant="danger" onClick={handleLogout} className="w-full">
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
