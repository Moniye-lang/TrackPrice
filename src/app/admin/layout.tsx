'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui-base';
import { Menu, X } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-gray-100 flex overflow-hidden">
            {/* Mobile Header with Hamburger */}
            <div className="md:hidden flex items-center justify-between bg-white p-4 border-b absolute top-0 w-full z-20 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800">TrackPrice Admin</h2>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 -mr-2 text-gray-600 hover:text-gray-900 focus:outline-none"
                    aria-label="Toggle Menu"
                >
                    {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out 
                md:relative md:translate-x-0 md:shadow-md
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">TrackPrice Admin</h2>
                    {/* Close button inside sidebar for mobile */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden text-gray-500 hover:text-gray-700"
                    >
                        <X size={24} />
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <Link
                        href="/admin/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-4 py-2 rounded-lg font-medium transition-colors ${pathname === '/admin/dashboard' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/admin/products"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-4 py-2 rounded-lg font-medium transition-colors ${pathname === '/admin/products' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                        Products
                    </Link>
                    <Link
                        href="/admin/users"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-4 py-2 rounded-lg font-medium transition-colors ${pathname === '/admin/users' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                        Users
                    </Link>
                    <Link
                        href="/admin/verification"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-4 py-2 rounded-lg font-medium transition-colors ${pathname === '/admin/verification' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                        Verification Queue
                    </Link>
                    <Link
                        href="/admin/messages"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-4 py-2 rounded-lg font-medium transition-colors ${pathname === '/admin/messages' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                        Forum Messages
                    </Link>
                    <Link
                        href="/admin/settings"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-4 py-2 rounded-lg font-medium transition-colors ${pathname === '/admin/settings' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                        Gamification Setup
                    </Link>
                </nav>
                <div className="p-4 border-t">
                    <Button variant="danger" onClick={handleLogout} className="w-full">
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Overlay for mobile backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 w-full h-screen">
                {children}
            </main>
        </div>
    );
}
