'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui-base';
import { formatPriceRange } from '@/lib/price-utils';
import { 
    Users, 
    Box, 
    Activity, 
    AlertTriangle, 
    Zap, 
    ArrowUpRight, 
    TrendingUp, 
    ShieldCheck, 
    BarChart3,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

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
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="animate-pulse flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Market Data</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-20 bg-rose-50 rounded-[2rem] border border-rose-100">
                <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
                <h3 className="text-xl font-black text-rose-900 mb-2">Analytics Sync Failed</h3>
                <p className="text-rose-600/70 font-medium">Please check your database connection or try again.</p>
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
        <Card className="p-8 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border-none shadow-premium bg-white">
            <div className={`absolute top-0 left-0 w-1 h-full bg-${color}-500 opacity-50`}></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{title}</p>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tight">{value}</h3>
                    {trend && (
                        <div className="flex items-center gap-1 mt-4 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                            <ArrowUpRight size={12} />
                            {trend}
                        </div>
                    )}
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-${color}-50 flex items-center justify-center text-${color}-500 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm`}>
                    <Icon size={24} />
                </div>
            </div>
            {/* Dynamic Pattern Background */}
            <div className="absolute -bottom-6 -right-6 text-slate-50 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                <Icon size={120} />
            </div>
        </Card>
    );

    return (
        <div className="space-y-12 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <nav className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Dashboard</span>
                    </nav>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        Market <span className="text-primary italic">Intelligence</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={async () => {
                            if (confirm('Create sample structured products and stores?')) {
                                const res = await fetch('/api/test/seed', { method: 'POST' });
                                const data = await res.json();
                                alert(data.message || data.error);
                                window.location.reload();
                            }
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white shadow-premium flex items-center gap-3 px-8 py-3 rounded-2xl transition-all active:scale-95"
                    >
                        <Zap size={18} className="text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest">Sync Sample Data</span>
                    </Button>
                </div>
            </div>

            {/* Top Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Global Users" value={stats.stats.totalUsers} icon={Users} color="blue" trend={`+${stats.stats.newUsersThisWeek} this week`} />
                <StatCard title="Active Products" value={stats.stats.totalProducts} icon={Box} color="primary" trend={`+${stats.stats.newProductsToday} today`} />
                <StatCard title="Price Updates" value={stats.stats.totalUpdates} icon={Activity} color="emerald" trend={`+${stats.stats.updatesToday} today`} />
                <StatCard title="Queue Status" value={stats.stats.pendingUpdates} icon={ShieldCheck} color="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Confidence Distribution */}
                <Card className="p-8 lg:col-span-2 bg-white border-none shadow-premium relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                <BarChart3 size={20} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Data Quality</h2>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Confidence Index</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center bg-slate-50/50 p-6 rounded-3xl border border-slate-100/50">
                        <div className="space-y-2">
                             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">High</p>
                             <div className="text-3xl font-black text-slate-800">{stats.confidenceDistribution.High || 0}</div>
                             <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${((stats.confidenceDistribution.High || 0) / stats.stats.totalProducts) * 100}%` }}></div>
                             </div>
                        </div>
                        <div className="space-y-2">
                             <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Medium</p>
                             <div className="text-3xl font-black text-slate-800">{stats.confidenceDistribution.Medium || 0}</div>
                             <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${((stats.confidenceDistribution.Medium || 0) / stats.stats.totalProducts) * 100}%` }}></div>
                             </div>
                        </div>
                        <div className="space-y-2">
                             <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Low</p>
                             <div className="text-3xl font-black text-slate-800">{stats.confidenceDistribution.Low || 0}</div>
                             <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-rose-500 h-full rounded-full transition-all duration-1000" style={{ width: `${((stats.confidenceDistribution.Low || 0) / stats.stats.totalProducts) * 100}%` }}></div>
                             </div>
                        </div>
                    </div>
                </Card>

                {/* Top Contributors */}
                <Card className="p-8 bg-white border-none shadow-premium overflow-hidden flex flex-col">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">Elite Scouts</h2>
                    <div className="space-y-4 flex-1">
                        {stats.topContributors.map((user: any, i: number) => (
                            <div key={user._id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group active:scale-95 cursor-default border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm ${
                                        i === 0 ? 'bg-amber-100 text-amber-600' : 
                                        i === 1 ? 'bg-slate-100 text-slate-600' : 
                                        'bg-slate-50 text-slate-400'
                                    }`}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{user.name}</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{user.reputationLevel}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-primary text-xs">{user.points}</p>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">XP</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Price Conflict Alerts */}
            {stats.priceConflicts && stats.priceConflicts.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                        <AlertTriangle className="text-rose-500 animate-pulse" size={24} />
                        Anomalies Detected
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {stats.priceConflicts.map((conflict: any) => (
                            <Card key={conflict._id} className="p-6 border-none shadow-premium bg-white group hover:bg-rose-50/20 transition-all flex justify-between items-center pr-10 relative overflow-hidden">
                                <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-1.5 h-12 bg-rose-500 rounded-full"></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2 flex items-center gap-2">
                                        <TrendingUp size={12} />
                                        High Volatility
                                    </p>
                                    <p className="font-black text-slate-800 text-lg">{conflict.productName}</p>
                                    <div className="flex items-center gap-3 mt-4">
                                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Global Avg</p>
                                            <p className="font-black text-slate-600">{formatPriceRange(conflict.currentPrice)}</p>
                                        </div>
                                        <div className="text-slate-300">→</div>
                                        <div className="bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                                            <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest">New Entry</p>
                                            <p className="font-black text-rose-600">{formatPriceRange(conflict.proposedPrice)}</p>
                                        </div>
                                    </div>
                                </div>
                                <Button className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center p-0 transition-all group-hover:scale-110 active:scale-90">
                                    <CheckCircle2 size={18} />
                                </Button>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
