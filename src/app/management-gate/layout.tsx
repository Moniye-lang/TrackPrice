'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
    History,
    MapPin
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
            if (pathname === '/management-gate/login') {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) {
                    router.push('/management-gate/login');
                } else {
                    const data = await res.json();
                    setUser(data.user);
                    setLoading(false);
                }
            } catch (error) {
                router.push('/management-gate/login');
            }
        };
        checkAuth();
    }, [router, pathname]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/management-gate/login');
        router.refresh();
    };

    const navItems = [
        { label: 'Dashboard', href: '/management-gate/dashboard', icon: LayoutDashboard },
        { label: 'Audit Logs', href: '/management-gate/audit-logs', icon: History },
        { label: 'Categorization', href: '/management-gate/categorization', icon: Zap },
        { label: 'Products', href: '/management-gate/products', icon: Box },
        { label: 'USERS', href: '/management-gate/users', icon: Users },
        { label: 'MARKETS/STORES', href: '/management-gate/stores', icon: Store },
        { label: 'Areas', href: '/management-gate/locations', icon: MapPin },
        { label: 'Verification', href: '/management-gate/verification', icon: ShieldCheck },
        { label: 'Forum', href: '/management-gate/messages', icon: MessageSquare },
        { label: 'Requests', href: '/management-gate/product-requests', icon: ClipboardList },
        { label: 'Extraction', href: '/management-gate/extraction', icon: Zap },
        { label: 'Settings', href: '/management-gate/settings', icon: Settings },
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

    if (pathname === '/management-gate/login') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-slate-950 flex overflow-hidden font-sans selection:bg-primary/30">
            {/* Mobile Header with Glassmorphism */}
            <div className="md:hidden fixed top-0 w-full z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 p-4 px-6 flex items-center justify-between shadow-sm">
                <Link href="/management-gate/dashboard" className="text-xl font-black text-white tracking-tighter uppercase">
                    Admin<span className="text-primary">.</span>
                </Link>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all active:scale-95"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar (Premium Deep Navy Theme) */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-[#050a14] border-r border-white/5 flex flex-col transform transition-all duration-500 ease-in-out
                md:relative md:translate-x-0
                ${isMobileMenuOpen ? 'translate-x-0 outline-none shadow-2xl' : '-translate-x-full shadow-none'}
            `}>
                {/* Sidebar Header */}
                <div className="p-8 pb-4">
                    <Link href="/management-gate/dashboard" className="flex items-center gap-3 group">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 shadow-glow-sm">
                            <Zap size={20} className="text-primary animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-white tracking-[0.2em] uppercase">Core</span>
                            <span className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">Console V2</span>
                        </div>
                    </Link>
                </div>

                {/* Navigation Scroll Area */}
                <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto no-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`
                                    flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 group relative overflow-hidden
                                    ${isActive 
                                        ? 'bg-primary/10 text-primary shadow-glow-sm ring-1 ring-primary/20' 
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                                `}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-0 w-1 h-full bg-primary shadow-[0_0_15px_rgba(255,107,0,0.8)]" />
                                )}
                                <Icon size={20} className={`${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-white'} transition-colors duration-300`} />
                                <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${isActive ? 'text-primary' : 'text-slate-300 group-hover:text-white'}`}>
                                    {item.label}
                                </span>
                                
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-glow animate-pulse" />
                                )}
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
