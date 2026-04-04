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
            <header className="sticky top-0 z-50 w-full glass border-b border-primary/10 transition-all duration-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-20 flex items-center justify-between gap-4">
                    <Link href="/" aria-label="TrackPricely Home" className="text-xl sm:text-2xl font-black text-primary tracking-tighter hover:scale-110 transition-transform flex-shrink-0 group">
                        TrackPricely<span className="text-accent group-hover:animate-ping inline-block">.</span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden sm:flex items-center gap-8">
                        <Link href="/forum" className={`text-sm font-black uppercase tracking-widest transition-colors relative group ${pathname === '/forum' ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}>
                            Forum
                            <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${pathname === '/forum' ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                        </Link>

                        <Link href="/leaderboard" className={`text-sm font-black uppercase tracking-widest transition-colors relative group ${pathname === '/leaderboard' ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}>
                            Leaderboard
                            <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${pathname === '/leaderboard' ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                        </Link>

                        {/* Stale Price CTA (Now part of the right nav group) */}
                        <Link href="/stale-prices" className="flex items-center gap-2 bg-primary/5 hover:bg-primary text-primary hover:text-white px-4 py-2 rounded-xl border border-primary/20 transition-all duration-500 group/btn shadow-glow-sm">
                            <TrendingUp size={14} className="group-hover/btn:scale-110 transition-transform" />
                            <span className="text-[9px] font-black uppercase tracking-[0.1em]">Update Price</span>
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
                                    aria-label="Logout"
                                    className="text-[10px] font-black text-slate-500 hover:text-rose-500 transition-colors uppercase tracking-[0.3em] flex items-center gap-2 group/logout"
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
                                        Start Tracking Prices
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </nav>

                    {/* Mobile Profile Icon (Top Bar) */}
                    <div className="sm:hidden flex items-center gap-3">
                        {user ? (
                            <Link href="/profile" aria-label="Profile" className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-premium-sm">
                                <CircleUser size={20} />
                            </Link>
                        ) : (
                            <Link href="/login" className="text-[10px] font-black text-primary hover:text-primary/80 uppercase tracking-widest border border-primary/20 px-3 py-1.5 rounded-xl bg-primary/5">
                                Log In
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Navigation Bar (Floating) */}
            <nav className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-950/90 backdrop-blur-3xl border border-white/10 px-4 py-3 flex justify-between items-center z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2.5rem] ring-1 ring-white/5">
                <Link href="/" aria-label="Home" className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${pathname === '/' ? 'text-primary scale-110 -translate-y-0.5' : 'text-slate-500 hover:text-slate-300'}`}>
                    <div className={`p-1.5 rounded-xl transition-all ${pathname === '/' ? 'bg-primary/20 shadow-glow-sm' : 'bg-transparent'}`}>
                        <Home size={20} strokeWidth={pathname === '/' ? 2.5 : 2} />
                    </div>
                    <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${pathname === '/' ? 'opacity-100' : 'opacity-40'}`}>Home</span>
                </Link>

                <Link href="/leaderboard" aria-label="Leaderboard" className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${pathname === '/leaderboard' ? 'text-primary scale-110 -translate-y-0.5' : 'text-slate-500 hover:text-slate-300'}`}>
                    <div className={`p-1.5 rounded-xl transition-all ${pathname === '/leaderboard' ? 'bg-primary/20 shadow-glow-sm' : 'bg-transparent'}`}>
                        <Trophy size={20} strokeWidth={pathname === '/leaderboard' ? 2.5 : 2} />
                    </div>
                    <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${pathname === '/leaderboard' ? 'opacity-100' : 'opacity-40'}`}>Rank</span>
                </Link>

                {/* Growth Engine: Update Price */}
                <Link href="/stale-prices" aria-label="Update Stale Prices" className={`flex flex-col items-center gap-1.5 transition-all duration-500 -translate-y-3`}>
                    <div className="w-12 h-12 bg-primary rounded-full shadow-glow flex items-center justify-center text-white ring-4 ring-slate-950">
                        <Plus size={24} strokeWidth={3} />
                    </div>
                    <span className="text-[7px] font-black text-primary uppercase tracking-[0.2em]">Update</span>
                </Link>

                <Link href="/forum" aria-label="Forum" className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${pathname === '/forum' ? 'text-primary scale-110 -translate-y-0.5' : 'text-slate-500 hover:text-slate-300'}`}>
                    <div className={`p-1.5 rounded-xl transition-all ${pathname === '/forum' ? 'bg-primary/20 shadow-glow-sm' : 'bg-transparent'}`}>
                        <MessageSquare size={20} strokeWidth={pathname === '/forum' ? 2.5 : 2} />
                    </div>
                    <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${pathname === '/forum' ? 'opacity-100' : 'opacity-40'}`}>Talk</span>
                </Link>

                <Link href="/profile" aria-label="Profile" className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${pathname === '/profile' ? 'text-primary scale-110 -translate-y-0.5' : 'text-slate-500 hover:text-slate-300'}`}>
                    <div className={`p-1.5 rounded-xl transition-all ${pathname === '/profile' ? 'bg-primary/20 shadow-glow-sm' : 'bg-transparent'}`}>
                        <CircleUser size={20} strokeWidth={pathname === '/profile' ? 2.5 : 2} />
                    </div>
                    <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${pathname === '/profile' ? 'opacity-100' : 'opacity-40'}`}>User</span>
                </Link>
            </nav>
        </div>
    );
}
