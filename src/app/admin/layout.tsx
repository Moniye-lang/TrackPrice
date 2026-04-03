'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui-base';
import { 
    LayoutDashboard, 
    Box, 
    Users, 
    ShieldCheck, 
    MessageSquare, 
    ClipboardList, 
    Zap, 
    Settings, 
    LogOut,
    Menu,
    X,
    TrendingUp,
    Store,
    History
} from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            if (pathname === '/admin/login') {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) {
                    router.push('/admin/login');
                } else {
                    const data = await res.json();
                    setUser(data.user);
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

    const navItems = [
        { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Audit Logs', href: '/admin/audit-logs', icon: History },
        { label: 'Categorization', href: '/admin/categorization', icon: Zap },
        { label: 'Products', href: '/admin/products', icon: Box },
        { label: 'Users', href: '/admin/users', icon: Users },
        { label: 'Markets/Stores', href: '/admin/stores', icon: Store },
        { label: 'Verification', href: '/admin/verification', icon: ShieldCheck },
        { label: 'Forum', href: '/admin/messages', icon: MessageSquare },
        { label: 'Requests', href: '/admin/product-requests', icon: ClipboardList },
        { label: 'Extraction', href: '/admin/extraction', icon: Zap },
        { label: 'Settings', href: '/admin/settings', icon: Settings },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Initializing Admin Console</p>
                </div>
            </div>
        );
    }

    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans">
            {/* Mobile Header with Glassmorphism */}
            <div className="md:hidden fixed top-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 p-4 px-6 flex items-center justify-between shadow-sm">
                <Link href="/admin/dashboard" className="text-xl font-black text-slate-900 tracking-tighter">
                    Admin<span className="text-primary">.</span>
                </Link>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:text-primary transition-all active:scale-95"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar (Deep Slate Theme) */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 flex flex-col transform transition-all duration-500 ease-in-out
                md:relative md:translate-x-0
                ${isMobileMenuOpen ? 'translate-x-0 outline-none' : '-translate-x-full shadow-none'}
            `}>
                {/* Sidebar Header */}
                <div className="p-8 pb-4">
                    <Link href="/admin/dashboard" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-glow-sm group-hover:scale-110 transition-transform">
                            <TrendingUp size={18} className="text-white" />
                        </div>
                        <h2 className="text-xl font-black text-white tracking-tight">TrackPricely Admin</h2>
                    </Link>
                </div>

                {/* Navigation Scroll Area */}
                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`
                                    flex items-center gap-4 px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 group
                                    ${isActive 
                                        ? 'bg-primary text-white shadow-glow-sm' 
                                        : 'text-slate-500 hover:bg-white/5 hover:text-white'}
                                `}
                            >
                                <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-600 group-hover:text-primary'} transition-colors`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile Footer */}
                <div className="p-4 mx-4 mb-4 mt-auto rounded-3xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 p-2">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-black">
                            {user?.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-black text-white truncate uppercase tracking-widest">{user?.name || 'Admin User'}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{user?.email || 'admin@trackpricely.com'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-rose-500/20"
                    >
                        <LogOut size={16} />
                        Sign Out Console
                    </button>
                </div>
            </aside>

            {/* Backdrop for Mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 z-40 md:hidden backdrop-blur-md transition-all duration-500"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <div className="flex-1 overflow-y-auto pt-20 md:pt-0 p-4 md:p-10 bg-mesh selection:bg-primary/20">
                    <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
