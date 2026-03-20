'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui-base';
import { formatPriceRange } from '@/lib/price-utils';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/admin/analytics');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch analytics', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return <div className="text-center py-20 font-medium text-slate-500">Loading Analytics Dashboard...</div>;
    }

    if (!stats) {
        return <div className="text-center py-20 text-rose-500">Failed to load analytics.</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Analytics Overview</h1>

            {/* Top Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-white border border-slate-100 shadow-sm">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Total Users</p>
                    <p className="text-4xl font-black text-slate-800">{stats.stats.totalUsers}</p>
                </Card>
                <Card className="p-6 bg-white border border-slate-100 shadow-sm">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Products Tracked</p>
                    <p className="text-4xl font-black text-slate-800">{stats.stats.totalProducts}</p>
                </Card>
                <Card className="p-6 bg-white border border-slate-100 shadow-sm">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Total Updates</p>
                    <p className="text-4xl font-black text-slate-800">{stats.stats.totalUpdates}</p>
                </Card>
                <Card className="p-6 bg-amber-50 border border-amber-100 shadow-sm">
                    <p className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-2">Pending Verifications</p>
                    <p className="text-4xl font-black text-amber-600">{stats.stats.pendingUpdates}</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Confidence Distribution */}
                <Card className="p-6">
                    <h2 className="text-lg font-black text-slate-800 mb-6">Price Confidence Distribution</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 font-bold text-emerald-600"><div className="w-3 h-3 rounded-full bg-emerald-500" /> High Confidence</span>
                            <span className="font-black text-slate-700">{stats.confidenceDistribution.High || 0}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.max(5, ((stats.confidenceDistribution.High || 0) / stats.stats.totalProducts) * 100)}%` }}></div>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <span className="flex items-center gap-2 font-bold text-amber-500"><div className="w-3 h-3 rounded-full bg-amber-500" /> Medium Confidence</span>
                            <span className="font-black text-slate-700">{stats.confidenceDistribution.Medium || 0}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.max(2, ((stats.confidenceDistribution.Medium || 0) / stats.stats.totalProducts) * 100)}%` }}></div>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <span className="flex items-center gap-2 font-bold text-rose-500"><div className="w-3 h-3 rounded-full bg-rose-500" /> Low Confidence</span>
                            <span className="font-black text-slate-700">{stats.confidenceDistribution.Low || 0}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${Math.max(1, ((stats.confidenceDistribution.Low || 0) / stats.stats.totalProducts) * 100)}%` }}></div>
                        </div>
                    </div>
                </Card>

                {/* Top Contributors */}
                <Card className="p-6">
                    <h2 className="text-lg font-black text-slate-800 mb-6">Top Contributors</h2>
                    <div className="space-y-4">
                        {stats.topContributors.map((user: any, i: number) => (
                            <div key={user._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                        #{i + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{user.name}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{user.reputationLevel}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-primary">{user.points} pts</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Price Conflict Alerts */}
            {stats.priceConflicts && stats.priceConflicts.length > 0 && (
                <Card className="p-6 border-amber-200 relative overflow-hidden bg-amber-50/30">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-xl">⚠️</span>
                        <h2 className="text-lg font-black text-slate-800">Critical Price Conflicts ({'>'}50% Change)</h2>
                    </div>
                    <div className="space-y-4">
                        {stats.priceConflicts.map((conflict: any) => (
                            <div key={conflict._id} className="p-4 rounded-xl border border-amber-200 bg-white shadow-sm flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <p className="font-bold text-slate-800">{conflict.productName}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-slate-400">Current: {formatPriceRange(conflict.currentPrice)}</span>
                                        <span className="text-lg font-black text-rose-500">→ {formatPriceRange(conflict.proposedPrice)}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impact Alert</p>
                                    <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">High Volatility</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Dispute Products */}
            <Card className="p-6 border-rose-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                <h2 className="text-lg font-black text-slate-800 mb-6">High Dispute / Flagged Products</h2>
                {stats.disputeProducts.length === 0 ? (
                    <p className="text-sm font-medium text-slate-500 italic">No highly disputed products currently.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stats.disputeProducts.map((prod: any) => (
                            <div key={prod._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-slate-800">{prod.name}</p>
                                    <p className="text-sm font-medium text-slate-500">{formatPriceRange(prod.price, prod.maxPrice)}</p>
                                </div>
                                <div className="flex gap-2">
                                    {prod.flagged && <span className="bg-rose-100 text-rose-600 px-2 py-1 rounded text-xs font-bold uppercase">Flagged</span>}
                                    <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs font-bold">{prod.reportCount} Reports</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
