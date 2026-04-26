'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gift, X, TrendingUp, Plus, ThumbsUp, Star, Award } from 'lucide-react';

export function ClientBanners() {
    const [showPointsBanner, setShowPointsBanner] = useState(false);

    useEffect(() => {
        const dismissed = sessionStorage.getItem('points-banner-dismissed');
        if (!dismissed) setShowPointsBanner(true);
    }, []);

    const dismissPointsBanner = () => {
        sessionStorage.setItem('points-banner-dismissed', '1');
        setShowPointsBanner(false);
    };

    if (!showPointsBanner) return null;

    return (
        <section className="max-w-5xl mx-auto px-4 pb-2 pt-0 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="relative rounded-[28px] overflow-hidden border border-primary/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
                {/* Glow blobs */}
                <div className="absolute -top-16 -left-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 p-6 md:p-8">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                                <Gift size={20} className="text-primary" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-white tracking-tight">How to Earn Points</h2>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Contribute & climb the leaderboard</p>
                            </div>
                        </div>
                        <button
                            onClick={dismissPointsBanner}
                            aria-label="Dismiss points info"
                            className="w-8 h-8 rounded-xl bg-slate-700/60 hover:bg-slate-600 flex items-center justify-center transition-colors text-slate-400 hover:text-white"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Earning actions grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        {/* Update a price */}
                        <div className="group flex flex-col gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 hover:-translate-y-0.5">
                            <div className="flex items-center justify-between">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                                    <TrendingUp size={18} className="text-emerald-400" />
                                </div>
                                <span className="text-lg font-black text-primary">+10 <span className="text-[10px] font-bold text-slate-500 uppercase">pts</span></span>
                            </div>
                            <div>
                                <p className="text-sm font-black text-white">Update a Price</p>
                                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Spot a price change at any market? Submit it and earn instantly.</p>
                            </div>
                        </div>

                        {/* Add a new product */}
                        <div className="group flex flex-col gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-accent/40 hover:bg-accent/5 transition-all duration-300 hover:-translate-y-0.5">
                            <div className="flex items-center justify-between">
                                <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                                    <Plus size={18} className="text-violet-400" />
                                </div>
                                <span className="text-lg font-black text-primary">+20 <span className="text-[10px] font-bold text-slate-500 uppercase">pts</span></span>
                            </div>
                            <div>
                                <p className="text-sm font-black text-white">Add a Product</p>
                                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Don't see an item listed? Request it and earn a bonus when it's added.</p>
                            </div>
                        </div>

                        {/* Vouch a price */}
                        <div className="group flex flex-col gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 hover:bg-amber-400/5 transition-all duration-300 hover:-translate-y-0.5">
                            <div className="flex items-center justify-between">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                                    <ThumbsUp size={18} className="text-amber-400" />
                                </div>
                                <span className="text-lg font-black text-primary">+5 <span className="text-[10px] font-bold text-slate-500 uppercase">pts</span></span>
                            </div>
                            <div>
                                <p className="text-sm font-black text-white">Vouch a Price</p>
                                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Confirm someone else's price update to build community trust and earn extra.</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer row */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-white/10">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Star size={12} className="text-amber-400 fill-amber-400" />
                            <span>Points never expire — keep contributing to unlock higher reputation tiers.</span>
                        </div>
                        <Link
                            href="/leaderboard"
                            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl hover:scale-105 transition-all shadow-glow-sm"
                        >
                            <Award size={13} />
                            See Leaderboard
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
