'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui-base';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

interface User {
    name: string;
    email: string;
    points: number;
    reputationLevel: string;
    city?: string;
    currentStreak: number;
    createdAt: string;
}

interface Activity {
    _id: string;
    productId: { name: string; brand?: string; variant?: string };
    price: number;
    status: string;
    createdAt: string;
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [activity, setActivity] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, activityRes] = await Promise.all([
                    fetch('/api/auth/me'),
                    fetch('/api/user/activity')
                ]);

                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData.user);
                }

                if (activityRes.ok) {
                    const activityData = await activityRes.json();
                    setActivity(activityData);
                }
            } catch (error) {
                console.error('Failed to fetch profile data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="text-center py-20">Loading profile...</div>;
    if (!user) return <div className="text-center py-20 font-bold text-rose-500">Please log in to view your profile.</div>;

    const getReputationColor = (level: string) => {
        switch (level) {
            case 'Elite Contributor': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Trusted Contributor': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <>
            <Navbar />
            <div className="max-w-4xl mx-auto py-12 px-4 space-y-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-10 rounded-[3rem] shadow-premium border border-slate-50">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-5xl font-black shadow-glow">
                        {user.name.charAt(0)}
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{user.name}</h1>
                            <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${getReputationColor(user.reputationLevel)}`}>
                                {user.reputationLevel}
                            </span>
                        </div>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{user.city || 'Nigeria'} | Member since {new Date(user.createdAt).getFullYear()}</p>
                        <div className="flex gap-4 mt-6 justify-center md:justify-start">
                            <div className="text-center">
                                <div className="text-3xl font-black text-primary">{user.points}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Points</div>
                            </div>
                            <div className="w-px h-10 bg-slate-100 mx-2" />
                            <div className="text-center">
                                <div className="text-3xl font-black text-slate-800">{activity.length}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contributions</div>
                            </div>
                            <div className="w-px h-10 bg-slate-100 mx-2" />
                            <div className="text-center">
                                <div className="text-3xl font-black text-orange-500">{user.currentStreak || 0}d</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Streak</div>
                            </div>
                        </div>
                    </div>
                    <Link href="/settings">
                        <Button variant="secondary" className="px-6 py-2 text-xs font-black uppercase tracking-widest bg-slate-50 border-none">Edit Profile</Button>
                    </Link>
                </div>

                {/* Recent Activity */}
                <div>
                    <h2 className="text-2xl font-black text-slate-800 mb-6 tracking-tight flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-lg">⚡</span>
                        Recent Activity
                    </h2>
                    <div className="space-y-4">
                        {activity.map(act => (
                            <Card key={act._id} className="p-6 flex justify-between items-center transition-all hover:scale-[1.01] hover:shadow-xl border-none shadow-premium">
                                <div className="flex items-center gap-6">
                                    <div className="hidden sm:flex w-12 h-12 rounded-xl bg-slate-50 items-center justify-center text-2xl">
                                        🛒
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800">{act.productId?.name}</h4>
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                            Value: <span className="text-slate-900 font-black">₦{act.price}</span> | {new Date(act.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${act.status === 'verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                    {act.status}
                                </span>
                            </Card>
                        ))}
                        {activity.length === 0 && (
                            <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                <p className="text-slate-400 font-bold uppercase tracking-widest">No contributions yet. Start tracking prices!</p>
                                <Link href="/">
                                    <Button className="mt-4 px-8 py-3 font-black text-xs uppercase tracking-widest shadow-glow">Go to Market</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
