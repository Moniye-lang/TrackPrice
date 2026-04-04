'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui-base';

interface Request {
    _id: string;
    userId: { name: string; email: string };
    name: string;
    category: string;
    brand?: string;
    variant?: string;
    size?: string;
    status: string;
    createdAt: string;
}

import { 
    ClipboardList, 
    User, 
    Calendar, 
    Tag, 
    Layers, 
    ChevronRight, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    PlusCircle,
    Info,
    ExternalLink,
    Filter,
    RefreshCw,
    ShieldCheck
} from 'lucide-react';

export default function ProductRequestsAdmin() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/product-requests');
            const data = await res.json();
            if (Array.isArray(data)) {
                setRequests(data);
            }
        } catch (error) {
            console.error('Fetch failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id: string, status: 'approved' | 'denied') => {
        try {
            const res = await fetch(`/api/product-requests/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                fetchRequests();
            }
        } catch (error) {
            console.error('Action failed');
        }
    };

    return (
        <div className="space-y-12 pb-20 max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                     <nav className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Growth Ops</span>
                    </nav>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        Community <span className="text-primary italic">Requests</span>
                    </h1>
                </div>
                <Button 
                    onClick={fetchRequests} 
                    variant="secondary"
                    className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 px-6 py-3 rounded-2xl transition-all"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sync Queue</span>
                </Button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="animate-pulse flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Querying Request Database</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {requests.map(req => (
                        <Card key={req._id} className="p-0 border-none shadow-premium bg-white overflow-hidden rounded-[2.5rem] group hover:scale-[1.01] transition-all duration-500">
                            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-50">
                                
                                {/* Info Section */}
                                <div className="p-8 flex-1 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border ${
                                                req.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                'bg-rose-50 text-rose-600 border-rose-100'
                                            }`}>
                                                {req.status}
                                            </span>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pl-2 border-l border-slate-100">
                                                <Calendar size={12} className="text-slate-300" />
                                                {new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-900 tracking-tight">{req.userId?.name || 'Anonymous'}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.1em]">{req.userId?.email}</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                                <User size={14} />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-4">{req.name}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="flex items-center gap-1.5 bg-slate-50 text-slate-500 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100">
                                                <Tag size={12} className="text-primary" />
                                                {req.category}
                                            </span>
                                            <span className="flex items-center gap-1.5 bg-slate-50 text-slate-500 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100">
                                                <Layers size={12} className="text-primary" />
                                                {req.brand || 'Generic'}
                                            </span>
                                            {req.variant && (
                                                <span className="flex items-center gap-1.5 bg-slate-50 text-slate-500 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100">
                                                    {req.variant}
                                                </span>
                                            )}
                                            {req.size && (
                                                <span className="flex items-center gap-1.5 bg-slate-50 text-slate-500 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100">
                                                    {req.size}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Section */}
                                <div className="p-8 md:w-64 bg-slate-50/30 flex flex-col justify-center gap-3">
                                    {req.status === 'pending' ? (
                                        <>
                                            <Button 
                                                onClick={() => {
                                                    alert('Redirecting to registry creator...');
                                                    window.location.href = `/admin/products?name=${encodeURIComponent(req.name)}&category=${encodeURIComponent(req.category)}&brand=${encodeURIComponent(req.brand || '')}`;
                                                }}
                                                className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-glow flex items-center justify-center gap-3 transition-all active:scale-95 group/btn"
                                            >
                                                <PlusCircle size={18} className="text-primary group-hover/btn:scale-110 transition-transform" />
                                                Approve
                                            </Button>
                                            <Button 
                                                variant="secondary" 
                                                onClick={() => handleAction(req._id, 'denied')}
                                                className="w-full py-4 rounded-2xl bg-white border border-slate-200 text-slate-400 font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95 flex items-center justify-center gap-3 group/btn"
                                            >
                                                <XCircle size={18} className="group-hover/btn:scale-110 transition-transform" />
                                                Deny
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-2 text-slate-300">
                                            <ShieldCheck size={32} strokeWidth={1} />
                                            <p className="text-[8px] font-black uppercase tracking-widest italic">Resolved Action</p>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </Card>
                    ))}
                    {requests.length === 0 && (
                        <div className="text-center py-32 bg-white rounded-[2.5rem] shadow-premium border border-slate-100 mt-12">
                            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                                <ClipboardList size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Registry Synchronized</h3>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Zero pending community requests at this time</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
