'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

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
        <header className="glass sticky top-4 z-50 mx-4 mt-4 rounded-2xl shadow-premium">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                <Link href="/" className="text-2xl font-black text-primary tracking-tighter hover:scale-105 transition-transform flex-shrink-0">
                    TrackPrice<span className="text-accent">.</span>
                </Link>

                <nav className="flex items-center gap-3 sm:gap-6">
                    <Link href="/forum" className="text-slate-600 hover:text-primary font-semibold transition-colors relative group text-sm hidden sm:block">
                        Forum
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                    </Link>

                    <Link href="/leaderboard" className="text-slate-600 hover:text-primary font-semibold transition-colors relative group text-sm hidden sm:block">
                        Leaderboard
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                    </Link>

                    {loading ? (
                        <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
                    ) : user ? (
                        <div className="flex items-center gap-4">
                            <Link href="/profile" className="hidden sm:flex items-center gap-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl transition-all">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm font-bold text-primary">
                                    {user.name?.split(' ')[0] ?? 'Profile'}
                                </span>
                            </Link>

                            {user.role === 'admin' && (
                                <Link href="/admin/dashboard" className="text-xs font-black text-amber-600 hover:text-amber-700 uppercase tracking-widest hidden md:block">
                                    Admin
                                </Link>
                            )}

                            <button
                                onClick={handleLogout}
                                className="text-xs font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Link href="/login" className="text-slate-600 hover:text-primary font-semibold transition-colors text-sm">
                                Log In
                            </Link>
                            <Link href="/register">
                                <button className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-primary/90 transition-colors shadow-glow">
                                    Sign Up
                                </button>
                            </Link>
                        </div>
                    )}
                </nav>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-3 flex justify-between items-center z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <Link href="/" className={`flex flex-col items-center gap-1 ${pathname === '/' ? 'text-primary' : 'text-slate-400'}`}>
                    <span className="text-xl">🏠</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
                </Link>
                <Link href="/leaderboard" className={`flex flex-col items-center gap-1 ${pathname === '/leaderboard' ? 'text-primary' : 'text-slate-400'}`}>
                    <span className="text-xl">🏆</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Rank</span>
                </Link>
                <Link href="/profile" className={`flex flex-col items-center gap-1 ${pathname === '/profile' ? 'text-primary' : 'text-slate-400'}`}>
                    <span className="text-xl">👤</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">User</span>
                </Link>
                <Link href="/forum" className={`flex flex-col items-center gap-1 ${pathname === '/forum' ? 'text-primary' : 'text-slate-400'}`}>
                    <span className="text-xl">💬</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Talk</span>
                </Link>
            </div>
        </header>
    );
}
