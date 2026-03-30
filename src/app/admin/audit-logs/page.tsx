'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui-base';
import { 
    History, 
    Search, 
    Filter, 
    ArrowRight, 
    Calendar, 
    User as UserIcon, 
    Shield, 
    Package, 
    Trash2, 
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Check,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';
import { format } from 'date-fns';

interface AuditLog {
    _id: string;
    adminId: {
        _id: string;
        name: string;
        email: string;
    };
    action: string;
    details: any;
    createdAt: string;
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/audit-logs?page=${page}&action=${actionFilter}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setTotal(data.total);
            }
        } catch (error) {
            console.error('Failed to fetch logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter]);

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'UPDATE_PRODUCT': return <Package size={16} className="text-primary" />;
            case 'DELETE_PRODUCT': return <Trash2 size={16} className="text-rose-500" />;
            case 'MODERATED_USER': return <Shield size={16} className="text-amber-500" />;
            case 'PRICE_VERIFIED': return <History size={16} className="text-emerald-500" />;
            default: return <AlertCircle size={16} className="text-slate-400" />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header section with glassmorphism */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">System Protocols</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <History size={12} className="text-primary" />
                        Administrative Audit Log & Security Trails
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                            <Filter size={14} />
                        </div>
                        <select 
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                            className="bg-white/80 border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">All Protocols</option>
                            <option value="UPDATE_PRODUCT">Product Updates</option>
                            <option value="DELETE_PRODUCT">Deletions</option>
                            <option value="MODERATED_USER">Moderation</option>
                        </select>
                    </div>
                    
                    <Button 
                        onClick={fetchLogs} 
                        className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-4 py-3 rounded-2xl shadow-sm"
                        disabled={loading}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </Button>
                </div>
            </div>

            {/* High-density Log Table */}
            <Card className="p-0 border-none bg-white/40 glass overflow-hidden shadow-premium">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200/60 bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8">
                                            <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <History size={48} className="text-slate-200" />
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No protocol records found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr key={log._id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                                {getActionIcon(log.action)}
                                            </div>
                                            <span className="text-[10px] font-black text-slate-900 tracking-wider">
                                                {log.action.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[8px] font-black">
                                                {log.adminId?.name?.[0] || 'A'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-700">{log.adminId?.name || 'System'}</span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase">{log.adminId?.email || 'automated-task@system.com'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="max-w-xs truncate">
                                            <span className="text-[10px] font-bold text-slate-600">
                                                {log.details?.productId ? `Product ID: ${log.details.productId.slice(-8)}` : 
                                                 log.details?.targetUserId ? `User: ${log.details.targetUserEmail}` : 
                                                 'System Operation'}
                                            </span>
                                            <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
                                                {log.details?.changes && (
                                                    <span className="text-[8px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 uppercase tracking-tighter">
                                                        Modified Fields: {Object.keys(log.details.changes).join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-700">{formatRelativeTime(log.createdAt)}</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase">{format(new Date(log.createdAt), 'MMM dd, yyyy • HH:mm:ss')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <Link href={`#${log._id}`} className="text-[9px] font-black text-primary hover:text-accent uppercase tracking-widest transition-colors flex items-center justify-end gap-1.5 group/link">
                                            View Snapshot
                                            <ArrowRight size={10} className="group-hover/link:translate-x-1 transition-transform" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer */}
                {total > 0 && (
                    <div className="px-6 py-4 flex items-center justify-between bg-slate-50/50 border-t border-slate-200/60 font-sans">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Showing <span className="text-slate-900">{(page-1)*20 + 1} - {Math.min(page*20, total)}</span> of {total} entries
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p-1))}
                                disabled={page === 1}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-primary disabled:opacity-50 transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-[10px] font-black text-slate-900 w-8 text-center">{page}</span>
                            <button 
                                onClick={() => setPage(p => p + 1)}
                                disabled={page * 20 >= total}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-primary disabled:opacity-50 transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/40 glass border-none p-6 shadow-premium relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-primary/5 group-hover:text-primary/10 transition-colors">
                        <Shield size={80} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Security Integrity</p>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">Consensus Hardened</h4>
                    <p className="text-[10px] font-bold text-emerald-500 mt-2 flex items-center gap-1 uppercase tracking-tighter">
                        <Check size={10} />
                        All protocols verified
                    </p>
                </Card>
                <Card className="bg-white/40 glass border-none p-6 shadow-premium relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors">
                        <History size={80} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Operations</p>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">{total.toLocaleString()}</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Since console launch</p>
                </Card>
                <Card className="bg-white/40 glass border-none p-6 shadow-premium relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-primary/5 group-hover:text-primary/10 transition-colors">
                        <Package size={80} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data Precision</p>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">Active Ingestion</h4>
                    <p className="text-[10px] font-bold text-primary mt-2 flex items-center gap-1 uppercase tracking-tighter">
                         <Zap size={10} className="fill-primary" />
                         Real-time tracking
                    </p>
                </Card>
            </div>
        </div>
    );
}
