'use client';

import { useState } from 'react';
import Image from 'next/image';

import { 
    Zap, 
    Link as LinkIcon, 
    MapPin, 
    Search, 
    CheckCircle2, 
    XCircle, 
    RefreshCw, 
    Database, 
    ShieldCheck, 
    Layers, 
    Activity,
    ExternalLink,
    ChevronRight,
    Sparkles,
    Trash2,
    Check,
    X
} from 'lucide-react';
import { Button, Input, Card } from '@/components/ui-base';

export default function ExtractionPage() {
    const [url, setUrl] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleExtract = async () => {
        if (!url) return;
        setLoading(true);
        setError('');
        setSuccessMsg('');
        setResults([]);

        try {
            const res = await fetch('/api/admin/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to extract.');

            const initialResults = data.data.map((item: any) => ({
                ...item,
                status: 'pending'
            }));
            setResults(initialResults);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateResult = (index: number, field: string, value: any) => {
        const newResults = [...results];
        newResults[index][field] = value;
        setResults(newResults);
    };

    const setAllStatus = (status: 'approved' | 'rejected') => {
        setResults(results.map(r => ({ ...r, status })));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/scrape/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: results, sourceUrl: url, location })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to submit.');

            setSuccessMsg(data.message);
            setResults([]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-12 pb-20 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                     <nav className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Data Engineering</span>
                    </nav>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        Pulse <span className="text-primary italic">Extraction</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Zap size={20} />
                    </div>
                    <div className="pr-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Engine Status</p>
                        <p className="text-xs font-bold text-slate-700">Structural Parser v2.4 Active</p>
                    </div>
                </div>
            </div>

            {/* URL Input Dashboard */}
            <Card className="p-8 border-none shadow-premium bg-white rounded-[2.5rem] overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end relative z-10">
                    <div className="lg:col-span-6 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                            <LinkIcon size={12} className="text-primary" />
                            Target URL Protocol
                        </label>
                        <div className="relative group">
                            <Input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://chowdeck.com/store/chicken-republic..."
                                className="h-16 pl-6 pr-12 text-sm font-bold bg-slate-50 border-transparent focus:bg-white focus:border-primary transition-all rounded-2xl shadow-inner group-hover:bg-white"
                                disabled={loading}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                                <Search size={20} aria-hidden="true" />
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-4 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                            <MapPin size={12} className="text-slate-400" />
                            Entity Origin (Location)
                        </label>
                        <Input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Bodija Market"
                            className="h-16 px-6 text-sm font-bold bg-slate-50 border-transparent focus:bg-white focus:border-primary transition-all rounded-2xl shadow-inner group-hover:bg-white"
                            disabled={loading}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <Button
                            onClick={handleExtract}
                            disabled={loading || !url}
                            className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-glow flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        >
                            {loading ? (
                                <RefreshCw className="animate-spin" size={18} />
                            ) : (
                                <Sparkles size={18} className="text-primary shadow-glow-sm" />
                            )}
                            {loading ? 'Analyzing' : 'Extract'}
                        </Button>
                    </div>
                </div>
                <p className="mt-6 text-[10px] font-bold text-slate-400 px-2 leading-relaxed max-w-2xl italic opacity-80">
                    Proprietary structural DOM heuristics will parse the target page for product hierarchies, pricing tiers, and asset mapping. No API keys or pre-configured scrapers required.
                </p>
            </Card>

            {/* Feedback Messages */}
            {error && (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                    <XCircle className="text-rose-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-rose-700">{error}</span>
                </div>
            )}
            {successMsg && (
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                    <CheckCircle2 className="text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-700">{successMsg}</span>
                </div>
            )}

            {/* Results Table */}
            {results.length > 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex justify-between items-end px-2">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Parser Registry</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Identified Entities: {results.length}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                onClick={() => setAllStatus('approved')} 
                                variant="secondary"
                                className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 rounded-xl px-4 py-2 font-black text-[9px] uppercase tracking-widest flex items-center gap-2"
                            >
                                <Check size={14} />
                                Authorize All
                            </Button>
                            <Button 
                                onClick={() => setAllStatus('rejected')} 
                                variant="secondary"
                                className="bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 rounded-xl px-4 py-2 font-black text-[9px] uppercase tracking-widest flex items-center gap-2"
                            >
                                <Trash2 size={14} />
                                Discard All
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-premium border border-slate-50 overflow-hidden">
                        <div className="overflow-x-auto max-h-[60vh] custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-20">Img</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Product Name (Mutable)</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Price (₦)</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Match Logic</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {results.map((item, i) => (
                                        <tr key={i} className={`group hover:bg-slate-50/80 transition-all duration-300 ${item.status === 'rejected' ? 'opacity-40 grayscale' : ''}`}>
                                            <td className="px-8 py-6">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 relative">
                                                    <Image 
                                                        src={item.imageUrl} 
                                                        alt={item.name} 
                                                        fill
                                                        sizes="48px"
                                                        className="object-cover"
                                                        onError={() => {
                                                            const newResults = [...results];
                                                            newResults[i].imageUrl = `https://placehold.co/600x400?text=${encodeURIComponent(item.name)}`;
                                                            setResults(newResults);
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <input
                                                    value={item.name}
                                                    onChange={e => handleUpdateResult(i, 'name', e.target.value)}
                                                    className="w-full bg-transparent border-none text-slate-900 font-black text-sm tracking-tight focus:ring-0 placeholder:text-slate-300"
                                                />
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-1.5 bg-slate-100/50 px-3 py-2 rounded-xl group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100">
                                                    <span className="text-slate-400 font-bold text-xs">₦</span>
                                                    <input
                                                        type="number"
                                                        value={item.price}
                                                        onChange={e => handleUpdateResult(i, 'price', Number(e.target.value))}
                                                        className="w-24 bg-transparent border-none p-0 text-slate-900 font-black text-base focus:ring-0"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {item.matchedProductId ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shadow-sm">
                                                            <Database size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 text-[11px] tracking-tight truncate max-w-[200px]">{item.matchedProductName}</p>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <Activity size={10} className="text-emerald-400" />
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Accuracy: {(1 - item.matchScore).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">New Potential Entity</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        onClick={() => handleUpdateResult(i, 'status', item.status === 'approved' ? 'pending' : 'approved')}
                                                        className={`p-2 rounded-xl transition-all shadow-sm ${
                                                            item.status === 'approved' 
                                                            ? 'bg-emerald-500 text-white shadow-glow-sm' 
                                                            : 'bg-slate-50 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'
                                                        }`}
                                                    >
                                                        <Check size={16} />
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleUpdateResult(i, 'status', item.status === 'rejected' ? 'pending' : 'rejected')}
                                                        className={`p-2 rounded-xl transition-all shadow-sm ${
                                                            item.status === 'rejected' 
                                                            ? 'bg-rose-500 text-white shadow-glow-sm' 
                                                            : 'bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50'
                                                        }`}
                                                    >
                                                        <X size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-8 bg-slate-50/50 flex items-center justify-between border-t border-slate-50">
                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <ShieldCheck size={16} className="text-primary" />
                                Review validation before pushing to production registry
                            </div>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || results.every(r => r.status === 'rejected')}
                                className="h-16 px-12 rounded-[2rem] bg-slate-900 text-white font-black uppercase tracking-[0.2em] shadow-glow flex items-center gap-4 hover:scale-105 active:scale-95 transition-all"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="animate-spin text-primary" size={20} />
                                        <span>Synchronizing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Layers className="text-primary" size={20} />
                                        <span>Deploy Registry Updates</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
