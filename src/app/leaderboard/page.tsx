'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui-base';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

interface User {
    _id: string;
    name: string;
    points: number;
    reputationLevel: string;
    city?: string;
    createdAt: string;
}

export default function LeaderboardPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async (city?: string) => {
        setLoading(true);
        try {
            const url = city ? `/api/leaderboard?city=${encodeURIComponent(city)}` : '/api/leaderboard';
            const res = await fetch(url);
            const data = await res.json();
            if (data.users) setUsers(data.users);
            if (data.cities) setCities(data.cities);
        } catch (error) {
            console.error('Fetch failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard(selectedCity);
    }, [selectedCity]);

    const getRankIcon = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return index + 1;
    };

    return (
        <>
            <Navbar />
            <div className="max-w-4xl mx-auto py-12 px-4 space-y-12 pb-24">
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Community Leaderboard</h1>
                    <p className="text-slate-500 font-medium max-w-xl mx-auto">Celebrating the heroes who keep Nigeria's market prices real and transparent.</p>
                </div>

                {/* Filters */}
                <div className="flex justify-center gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    <button
                        onClick={() => setSelectedCity('')}
                        className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCity === '' ? 'bg-primary text-white border-primary shadow-glow' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                            }`}
                    >
                        Overall
                    </button>
                    {cities.map(city => (
                        <button
                            key={city}
                            onClick={() => setSelectedCity(city)}
                            className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCity === city ? 'bg-primary text-white border-primary shadow-glow' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                                }`}
                        >
                            {city}
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest">Loading Rankings...</div>
                ) : (
                    <Card className="overflow-hidden border-none shadow-premium rounded-[2rem]">
                        <div className="bg-slate-900 text-white p-6 grid grid-cols-12 text-[10px] font-black uppercase tracking-[0.2em]">
                            <div className="col-span-1 text-center">Rank</div>
                            <div className="col-span-6 px-4">Contributor</div>
                            <div className="col-span-3 text-right">Reputation</div>
                            <div className="col-span-2 text-right">Points</div>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {users.map((user, index) => (
                                <div key={user._id} className="p-6 grid grid-cols-12 items-center hover:bg-slate-50/50 transition-colors">
                                    <div className="col-span-1 text-center text-xl font-black text-slate-300">
                                        {getRankIcon(index)}
                                    </div>
                                    <div className="col-span-6 px-4 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-800">{user.name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.city || 'Nigeria'}</div>
                                        </div>
                                    </div>
                                    <div className="col-span-3 text-right">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${user.reputationLevel === 'Elite Contributor' ? 'text-amber-600' :
                                            user.reputationLevel === 'Trusted Contributor' ? 'text-blue-600' :
                                                'text-slate-400'
                                            }`}>
                                            {user.reputationLevel}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-right font-black text-primary text-lg">
                                        {user.points.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Call to Action */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-12 rounded-[3rem] text-center space-y-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -z-0"></div>
                    <h3 className="text-3xl font-black text-white tracking-tight relative z-10">Where do you stand?</h3>
                    <p className="text-slate-400 font-medium relative z-10">Every price update brings you closer to becoming an Elite Contributor.</p>
                    <div className="pt-4 relative z-10">
                        <Link href="/">
                            <Button className="px-12 py-4 font-black uppercase tracking-widest shadow-glow">Start Contributing</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
