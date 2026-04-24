'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Trophy, User, MessageSquare, CircleUser, LogOut, LayoutDashboard, Search, Activity, Heart, ShoppingBag, Menu, X, TrendingUp, Plus, Bell, Sun, Moon } from 'lucide-react';
import { Button } from './ui-base';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from 'next-themes';
import Image from 'next/image';

export function Navbar() {
    const { user, isLoading } = useAuth();
    const logoutStore = useAuthStore((state) => state.logout);
    const router = useRouter();
    const pathname = usePathname();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [forumCount, setForumCount] = useState(0);
    const [unreadForum, setUnreadForum] = useState(0);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const fetchCounts = async () => {
            try {
                // Fetch notifications
                const notifRes = await fetch('/api/notifications');
                if (notifRes.ok) {
                    const data = await notifRes.json();
                    setNotifications(data);
                }

                // Fetch forum message count efficiently
                const forumRes = await fetch('/api/messages?countOnly=true');
                if (forumRes.ok) {
                    const data = await forumRes.json();
                    const currentTotal = data.count || 0;
                    setForumCount(currentTotal);

                    // Calculate unread based on local storage
                    const lastSeen = localStorage.getItem('forum_last_seen_count');
                    const lastSeenCount = lastSeen ? parseInt(lastSeen, 10) : 0;
                    
                    if (pathname === '/forum') {
                        localStorage.setItem('forum_last_seen_count', currentTotal.toString());
                        setUnreadForum(0);
                    } else {
                        setUnreadForum(Math.max(0, currentTotal - lastSeenCount));
                    }
                }
            } catch (error) {
                console.error(error);
            }
        };

        fetchCounts();
        const interval = setInterval(fetchCounts, 5000);
        return () => clearInterval(interval);
    }, [pathname]);

    const markAsRead = async (id: string, messageId: string, productId?: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id })
            });
            setNotifications(prev => prev.filter(n => n._id !== id));
            
            setShowNotifications(false);
            if (productId) {
                router.push(`/product/${productId}#msg-${messageId}`);
            } else {
                router.push(`/forum#msg-${messageId}`);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = async () => {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        if (res.ok) {
            logoutStore();
            router.refresh();
            router.push('/');
        }
    };

    return (
        <div className="z-50">
            {/* Top Logo Bar (Mobile & Desktop) */}
            <header className="sticky top-0 z-50 w-full glass border-b border-primary/10 transition-all duration-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-20 flex items-center justify-between gap-4">
                    <Link href="/" aria-label="TrackPricely Home" className="hover:scale-105 transition-transform flex-shrink-0 group flex items-center">
                        <Image 
                            src="/trplogo.PNG" 
                            alt="TrackPricely Logo" 
                            width={240} 
                            height={72} 
                            className="h-9 md:h-12 lg:h-14 w-auto object-contain"
                            priority
                        />
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-4 xl:gap-10">
                        <Link href="/forum" className={`text-base font-black uppercase tracking-widest transition-colors relative group ${pathname === '/forum' ? 'text-primary' : 'text-slate-600 dark:text-slate-400 hover:text-primary'}`}>
                            Forum
                            {unreadForum > 0 && (
                                <span className="absolute -top-3 -right-6 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-glow animate-bounce-subtle">
                                    {unreadForum > 99 ? '99+' : unreadForum}
                                </span>
                            )}
                            <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${pathname === '/forum' ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                        </Link>

                        <Link href="/leaderboard" className={`text-base font-black uppercase tracking-widest transition-colors relative group ${pathname === '/leaderboard' ? 'text-primary' : 'text-slate-600 dark:text-slate-400 hover:text-primary'}`}>
                            Leaderboard
                            <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${pathname === '/leaderboard' ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                        </Link>

                        {/* Actions */}
                        <div className="flex items-center gap-3 relative">
{mounted && (
    <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-primary"
        aria-label="Toggle Dark Mode"
    >
        {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
    </button>
)}

<button 
    onClick={() => setShowNotifications(!showNotifications)}
    className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-primary"
    aria-label="Notifications"
>
    <Bell size={24} />
    {notifications.length > 0 && (
        <span className="absolute top-0 right-0 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse shadow-glow">
            {notifications.length}
        </span>
    )}
</button>

{/* Notifications Dropdown */}
{showNotifications && (
    <div className="absolute top-full right-0 mt-4 w-80 bg-white border border-slate-200 rounded-2xl shadow-premium overflow-hidden z-50">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Notifications</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                    No new notifications
                </div>
            ) : (
                notifications.map(notif => (
                    <button
                        key={notif._id}
                        onClick={() => markAsRead(notif._id, notif.messageId?._id, notif.productId?._id)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors"
                    >
                        <div className="text-xs font-semibold text-primary mb-1">New Reply</div>
                        <div className="text-sm text-slate-600 line-clamp-2">
                            {notif.content || "Someone replied to your message."}
                        </div>
                    </button>
                ))
            )}
        </div>
    </div>
)}

                            <Link href="/stale-prices" className="flex items-center gap-2 bg-primary/5 hover:bg-primary text-primary hover:text-white px-5 py-2.5 rounded-xl border border-primary/20 transition-all duration-500 group/btn shadow-glow-sm">
                                <TrendingUp size={16} className="group-hover/btn:scale-110 transition-transform" />
                                <span className="text-xs font-black uppercase tracking-[0.1em]">Update Price</span>
                            </Link>
                        </div>

                        {isLoading ? (
                            <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
                        ) : user ? (
                            <div className="flex items-center gap-8 border-l border-slate-100 pl-8 ml-2">
                                <Link href="/profile" className="flex items-center gap-3 bg-primary/5 hover:bg-primary/10 border border-primary/20 px-5 py-2.5 rounded-2xl transition-all shadow-premium-sm group/profile">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-sm font-black text-primary uppercase tracking-widest">
                                        {user.name?.split(' ')[0] ?? 'Profile'}
                                    </span>
                                    <CircleUser size={20} className="text-primary/60 group-hover/profile:text-primary transition-colors" aria-hidden="true" />
                                </Link>

                                {user.role === 'admin' && (
                                    <Link href="/management-gate/dashboard" className="text-xs font-black text-amber-600 hover:text-amber-700 uppercase tracking-[0.2em] border border-amber-200/50 px-4 py-2 rounded-xl bg-amber-50">
                                        Admin
                                    </Link>
                                )}

                                <button
                                    onClick={handleLogout}
                                    aria-label="Logout"
                                    className="text-xs font-black text-slate-500 hover:text-rose-500 transition-colors uppercase tracking-[0.2em] flex items-center gap-2 group/logout"
                                >
                                    <LogOut size={18} className="group-hover/logout:-translate-x-1 transition-transform" />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-8 border-l border-slate-100 dark:border-slate-800 pl-8 ml-2">
                                <Link href="/login" className="text-sm font-black text-slate-500 dark:text-slate-400 hover:text-primary uppercase tracking-widest">
                                    Log In
                                </Link>
                                <Link href="/register">
                                    <Button className="px-8 py-3 rounded-2xl text-xs uppercase tracking-[0.2em] font-black shadow-premium">
                                        Start Tracking Prices
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </nav>

                    {/* Mobile Profile Icon (Top Bar) */}
                    <div className="lg:hidden flex items-center gap-3 relative">
                        {mounted && (
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="relative p-2 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                        )}
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                            <Bell size={20} />
                            {notifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                                    {notifications.length}
                                </span>
                            )}
                        </button>
                        
                        {/* Mobile Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium overflow-hidden z-50">
                                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-800 dark:text-slate-100">Notifications</h3>
                                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                            No new notifications
                                        </div>
                                    ) : (
                                        notifications.map(notif => (
                                            <button
                                                key={notif._id}
                                                onClick={() => markAsRead(notif._id, notif.messageId?._id, notif.productId?._id)}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-50 dark:border-slate-800 transition-colors"
                                            >
                                                <div className="text-xs font-semibold text-primary mb-1">New Reply</div>
                                                <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                                    {notif.content || "Someone replied to your message."}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {user ? (
                            <Link href="/profile" aria-label="Profile" className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-premium-sm">
                                <CircleUser size={20} />
                            </Link>
                        ) : (
                            <Link href="/login" className="text-xs font-black text-primary hover:text-primary/80 uppercase tracking-widest border border-primary/20 px-4 py-2 rounded-xl bg-primary/5">
                                Log In
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Navigation Bar (Floating) */}
            <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-950 border border-slate-800 px-4 py-2 flex justify-between items-center z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-[2rem] ring-1 ring-white/5">
                <Link href="/" aria-label="Home" className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${pathname === '/' ? 'text-primary scale-110 -translate-y-0.5' : 'text-slate-500 hover:text-slate-300'}`}>
                    <div className={`p-1.5 rounded-xl transition-all ${pathname === '/' ? 'bg-primary/20 shadow-glow-sm' : 'bg-transparent'}`}>
                        <Home size={22} strokeWidth={pathname === '/' ? 2.5 : 2} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${pathname === '/' ? 'opacity-100' : 'opacity-70 text-slate-300'}`}>Home</span>
                </Link>

                <Link href="/leaderboard" aria-label="Leaderboard" className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${pathname === '/leaderboard' ? 'text-primary scale-110 -translate-y-0.5' : 'text-slate-500 hover:text-slate-300'}`}>
                    <div className={`p-1.5 rounded-xl transition-all ${pathname === '/leaderboard' ? 'bg-primary/20 shadow-glow-sm' : 'bg-transparent'}`}>
                        <Trophy size={22} strokeWidth={pathname === '/leaderboard' ? 2.5 : 2} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${pathname === '/leaderboard' ? 'opacity-100' : 'opacity-70 text-slate-300'}`}>Rank</span>
                </Link>

                {/* Growth Engine: Update Price */}
                <Link href="/stale-prices" aria-label="Update Stale Prices" className={`flex flex-col items-center gap-1.5 transition-all duration-500 -translate-y-3`}>
                    <div className="w-12 h-12 bg-primary rounded-full shadow-glow flex items-center justify-center text-white ring-4 ring-slate-950">
                        <Plus size={24} strokeWidth={3} />
                    </div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.1em]">Update</span>
                </Link>

                <Link href="/forum" aria-label="Forum" className={`flex flex-col items-center gap-1.5 transition-all duration-500 relative ${pathname === '/forum' ? 'text-primary scale-110 -translate-y-0.5' : 'text-slate-500 hover:text-slate-300'}`}>
                    {unreadForum > 0 && (
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-slate-950 z-10 animate-bounce-subtle">
                            {unreadForum > 9 ? '9+' : unreadForum}
                        </span>
                    )}
                    <div className={`p-1.5 rounded-xl transition-all ${pathname === '/forum' ? 'bg-primary/20 shadow-glow-sm' : 'bg-transparent'}`}>
                        <MessageSquare size={22} strokeWidth={pathname === '/forum' ? 2.5 : 2} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${pathname === '/forum' ? 'opacity-100' : 'opacity-70 text-slate-300'}`}>Talk</span>
                </Link>

                <Link href="/profile" aria-label="Profile" className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${pathname === '/profile' ? 'text-primary scale-110 -translate-y-0.5' : 'text-slate-500 hover:text-slate-300'}`}>
                    <div className={`p-1.5 rounded-xl transition-all ${pathname === '/profile' ? 'bg-primary/20 shadow-glow-sm' : 'bg-transparent'}`}>
                        <CircleUser size={22} strokeWidth={pathname === '/profile' ? 2.5 : 2} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${pathname === '/profile' ? 'opacity-100' : 'opacity-70 text-slate-300'}`}>User</span>
                </Link>
            </nav>
        </div>
    );
}
