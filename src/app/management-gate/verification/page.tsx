'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button, Card } from '@/components/ui-base';
import { formatPriceRange } from '@/lib/price-utils';

interface PriceUpdate {
    _id: string;
    product: {
        _id: string;
        name: string;
        price: number;
        maxPrice?: number;
        imageUrl: string;
        category: string;
        flagged: boolean;
    };
    user: {
        _id: string;
        name: string;
        email: string;
        reputationLevel: string;
        points: number;
        isBanned: boolean;
    };
    price: number;
    maxPrice?: number;
    status: string;
    createdAt: string;
}

import { 
    ShieldAlert, 
    CheckCircle2, 
    XCircle, 
    ArrowRight, 
    TrendingUp, 
    TrendingDown, 
    User, 
    Clock, 
    History, 
    ArrowUpRight,
    AlertCircle,
    Zap,
    RefreshCw,
    ExternalLink,
    Box
} from 'lucide-react';

import { useAdminQueue, useAdminAction } from '@/hooks/useAdmin';

export default function AdminVerificationQueue() {
    const { data: updates = [], isLoading: loading, refetch } = useAdminQueue();
    const actionMutation = useAdminAction();

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        if (!confirm(`Are you sure you want to FORCE ${action.toUpperCase()} this price update?`)) return;
        
        try {
            await actionMutation.mutateAsync({ id, action });
        } catch (error: any) {
            alert(error.message || `Failed to ${action} update`);
        }
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                     <nav className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Quality Assurance</span>
                    </nav>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        Verification <span className="text-primary italic">Queue</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={() => refetch()} 
                        variant="secondary"
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 px-6 py-3 rounded-2xl transition-all"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sync Queue</span>
                    </Button>
                </div>
            </div>

            {/* Alert/Notice Block */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 relative overflow-hidden shadow-premium text-white border border-slate-800">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px] rounded-full -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-glow shrink-0 border border-primary/20">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight mb-2 uppercase">Manual Intervention Required</h2>
                        <p className="text-slate-400 text-sm font-bold leading-relaxed max-w-2xl opacity-80">
                            These price updates have triggered system anomalies. They involve flagged products with high variance or lack sufficient community validation. Overriding here bypasses the automatic consensus protocol.
                        </p>
                    </div>
                </div>
            </div>

            {loading ? (
                 <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="animate-pulse flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Querying Verification Registry</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {updates.length === 0 ? (
                        <div className="text-center py-32 bg-white rounded-[2.5rem] shadow-premium border border-slate-100 mt-12">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">System Fully Synchronized</h3>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">All pending reports have been successfully processed</p>
                        </div>
                    ) : (
                        updates.map((update: PriceUpdate) => (
                            <Card key={update._id} className="p-0 border-none shadow-premium bg-white overflow-hidden rounded-[2.5rem] group hover:scale-[1.01] transition-all duration-500">
                                <div className="flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-slate-50">
                                    
                                    {/* Left: Product & Submitter */}
                                    <div className="p-8 xl:w-2/5 space-y-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 shadow-sm relative group-hover:scale-105 transition-transform duration-500">
                                                <Image src={update.product?.imageUrl} alt={update.product?.name || 'Product Image'} fill sizes="80px" className="object-cover" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-black text-slate-900 text-lg tracking-tight leading-tight">{update.product?.name || 'Deleted Product'}</h3>
                                                    {update.product?.flagged && (
                                                        <span className="bg-rose-50 text-rose-500 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-rose-100">Flagged</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-lg">{update.product?.category}</span>
                                                    <div className="flex items-center gap-1">
                                                        <History size={10} className="text-slate-300" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Value: {formatPriceRange(update.product?.price || 0, update.product?.maxPrice)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-50">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <User size={10} className="text-primary" aria-hidden="true" />
                                                Reported By
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm tracking-tight">{update.user?.name || 'Anonymous Operator'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1">{update.user?.email}</p>
                                                </div>
                                                <div className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-sm ${
                                                    update.user?.reputationLevel === 'Elite Contributor' ? 'bg-amber-100 text-amber-700 border border-amber-200/50' :
                                                    update.user?.reputationLevel === 'Trusted Contributor' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200/50' :
                                                    'bg-slate-100 text-slate-600 border border-slate-200/50'
                                                }`}>
                                                    {update.user?.reputationLevel}
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center gap-2 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                                <Clock size={10} />
                                                Timestamp: {new Date(update.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: The Delta Analysis */}
                                    <div className="p-8 xl:w-2/5 flex flex-col justify-center gap-8 bg-slate-50/20">
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Market Deviation Analysis</p>
                                                {update.product && (
                                                    <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
                                                        update.price > update.product.price ? 'text-rose-500' : 'text-emerald-500'
                                                    }`}>
                                                        {update.price > update.product.price ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                        {(((update.price - update.product.price) / update.product.price) * 100).toFixed(1)}% Variance
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-6 justify-center py-6 bg-white rounded-3xl border border-slate-50 shadow-sm relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                                                <div className="text-center">
                                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Old Price</p>
                                                    <p className="text-lg font-black text-slate-400 line-through decoration-slate-200">{formatPriceRange(update.product?.price || 0)}</p>
                                                </div>
                                                <ArrowRight className="text-primary italic animate-pulse" size={24} />
                                                <div className="text-center">
                                                    <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">New Proposed</p>
                                                    <p className="text-4xl font-black text-slate-900 tracking-tighter">{formatPriceRange(update.price, update.maxPrice)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Decision Controls */}
                                    <div className="p-8 xl:w-1/5 flex flex-col justify-center gap-3">
                                        <Button
                                            onClick={() => handleAction(update._id, 'approve')}
                                            disabled={actionMutation.isPending && actionMutation.variables?.id === update._id}
                                            className="w-full py-5 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-glow flex items-center justify-center gap-3 transition-all active:scale-95 group/btn"
                                        >
                                            <CheckCircle2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                                            {actionMutation.isPending && actionMutation.variables?.id === update._id ? 'Processing...' : 'Authorize'}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => handleAction(update._id, 'reject')}
                                            disabled={actionMutation.isPending && actionMutation.variables?.id === update._id}
                                            className="w-full py-5 rounded-2xl bg-white border border-slate-200 text-slate-400 font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95 flex items-center justify-center gap-3 group/btn"
                                        >
                                            <XCircle size={18} className="group-hover/btn:scale-110 transition-transform" />
                                            {actionMutation.isPending && actionMutation.variables?.id === update._id ? 'Wait...' : 'Discard'}
                                        </Button>
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest text-center mt-2 leading-relaxed px-4">
                                            Actions are permanent and affect user reputation & database integrity.
                                        </p>
                                    </div>

                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
