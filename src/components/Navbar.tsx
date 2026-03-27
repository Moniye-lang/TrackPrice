'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Trophy, User, MessageSquare, CircleUser, LogOut, LayoutDashboard, Search, Activity, Heart, ShoppingBag, Menu, X, TrendingUp, Plus } from 'lucide-react';
import { Button } from './ui-base';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export function Navbar() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                }
            } catch {
                // Not logged in, ignore
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        router.refresh();
        router.push('/');
    };

    return (
        <div className="z-50">
            {/* Top Logo Bar (Mobile & Desktop) */}
            <header className="sm:sticky sm:top-4 z-50 sm:mx-4 sm:mt-4 sm:glass sm:rounded-3xl sm:shadow-premium sm:border sm:border-white/20 transition-all duration-500">
                <div className="max-w-7xl mx-auto px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
                    <Link href="/" className="text-2xl font-black text-primary tracking-tighter hover:scale-110 transition-transform flex-shrink-0 group">
                        TrackPrice<span className="text-accent group-hover:animate-ping inline-block">.</span>
                    </Link>

                    {/* Central CTA (Desktop Only) */}
                    <Link href="/request-product" className="hidden lg:flex items-center gap-2 bg-primary/5 hover:bg-primary text-primary hover:text-white px-5 py-2 rounded-2xl border border-primary/20 transition-all duration-500 group/btn shadow-glow-sm">
                        <TrendingUp size={16} className="group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Update Price</span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden sm:flex items-center gap-8">
                        <Link href="/forum" className={`text-sm font-black uppercase tracking-widest transition-colors relative group ${pathname === '/forum' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>
                            Forum
                            <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${pathname === '/forum' ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                        </Link>

                        <Link href="/leaderboard" className={`text-sm font-black uppercase tracking-widest transition-colors relative group ${pathname === '/leaderboard' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>
                            Leaderboard
                            <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${pathname === '/leaderboard' ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                        </Link>

                        {loading ? (
                            <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
                        ) : user ? (
                            <div className="flex items-center gap-6 border-l border-slate-100 pl-6 ml-2">
                                <Link href="/profile" className="flex items-center gap-3 bg-primary/5 hover:bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl transition-all shadow-premium-sm group/profile">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-black text-primary uppercase tracking-widest">
                                        {user.name?.split(' ')[0] ?? 'Profile'}
                                    </span>
                                    <CircleUser size={18} className="text-primary/40 group-hover/profile:text-primary transition-colors" />
                                </Link>

                                {user.role === 'admin' && (
                                    <Link href="/admin/dashboard" className="text-[10px] font-black text-amber-600 hover:text-amber-700 uppercase tracking-[0.3em] border border-amber-200/50 px-3 py-1.5 rounded-xl bg-amber-50">
                                        Admin
                                    </Link>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-[0.3em] flex items-center gap-2 group/logout"
                                >
                                    <LogOut size={16} className="group-hover/logout:-translate-x-1 transition-transform" />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6 border-l border-slate-100 pl-6 ml-2">
                                <Link href="/login" className="text-xs font-black text-slate-500 hover:text-primary uppercase tracking-widest">
                                    Log In
                                </Link>
                                <Link href="/register">
                                    <Button className="px-6 py-2.5 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-black shadow-premium">
                                        Join Community
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </nav>

                    {/* Mobile Profile Icon (Top Bar) */}
                    <div className="sm:hidden flex items-center gap-4">
                        {user ? (
                            <Link href="/profile" className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-premium-sm">
                                <CircleUser size={22} />
                            </Link>
                        ) : (
                            <Link href="/login" className="text-[10px] font-black text-primary hover:text-primary/80 uppercase tracking-widest border border-primary/20 px-4 py-2 rounded-2xl bg-primary/5">
                                Log In
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Navigation Bar (Floating) */}
            <nav className="sm:hidden fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-slate-950/90 backdrop-blur-3xl border border-white/10 px-6 py-4 flex justify-between items-center z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2.5rem] ring-1 ring-white/5">
                <Link href="/" className={`flex flex-col items-center gap-2 transition-all duration-500 ${pathname === '/' ? 'text-primary scale-110 -translate-y-1' : 'text-slate-500 hover:text-slate-300'}`}>
                    <div className={`p-2 rounded-2xl transition-all ${pathname === '/' ? 'bg-primary/20 shadow-glow-sm' : 'bg-transparent'}`}>
                        <Home size={22} strokeWidth={pathname === '/' ? 2.5 : 2} />
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${pathname === '/' ? 'opacity-100' : 'opacity-40'}`}>Home</span>
                </Link>

                <Link href="/leaderboard" className={`flex flex-col items-center gap-2 transition-all duration-500 ${pathname === '/leaderboard' ? 'text-primary scale-110 -translate-y-1' : 'text-slate-500 hover:text-slate-300'}`}>
                    <div className={`p-2 rounded-2xl transition-all ${pathname === '/leaderboard' ? 'bg-primary/20 shadow-glow-sm' : 'bg-transparent'}`}>
                        <Trophy size={22} strokeWidth={pathname === '/leaderboard' ? 2.5 : 2} />
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${pathname === '/leaderboard' ? 'opacity-100' : 'opacity-40'}`}>Rank</span>
                </Link>

                {/* Growth Engine: Update Price */}
                <Link href="/request-product" className={`flex flex-col items-center gap-2 transition-all duration-500 -translate-y-4`}>
                    <div className="w-14 h-14 bg-primary rounded-full shadow-glow flex items-center justify-center text-white ring-4 ring-slate-950">
                        <Plus size={28} strokeWidth={3} />
                    </div>
                    <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Update</span>
                </Link>

                <Link href="/forum" className={`flex flex-col items-center gap-2 transition-all duration-500 ${pathname === '/forum' ? 'text-primary scale-110 -translate-y-1' : 'text-slate-500 hover:text-slate-300'}`}>
                    <div className={`p-2 rounded-2xl transition-all ${pathname === '/forum' ? 'bg-primary/20 shadow-glow-sm' : 'bg-transparent'}`}>
                        <MessageSquare size={22} strokeWidth={pathname === '/forum' ? 2.5 : 2} />
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${pathname === '/forum' ? 'opacity-100' : 'opacity-40'}`}>Talk</span>
                </Link>

                <Link href="/profile" className={`flex flex-col items-center gap-2 transition-all duration-500 ${pathname === '/profile' ? 'text-primary scale-110 -translate-y-1' : 'text-slate-500 hover:text-slate-300'}`}>
                    <div className={`p-2 rounded-2xl transition-all ${pathname === '/profile' ? 'bg-primary/20 shadow-glow-sm' : 'bg-transparent'}`}>
                        <CircleUser size={22} strokeWidth={pathname === '/profile' ? 2.5 : 2} />
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${pathname === '/profile' ? 'opacity-100' : 'opacity-40'}`}>User</span>
                </Link>
            </nav>
        </div>
    );
}
