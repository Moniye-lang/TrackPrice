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
    const [marketCategory, setMarketCategory] = useState<'Physical' | 'Online'>('Physical');
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
                body: JSON.stringify({ url, location, marketCategory })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to extract.');

            const initialResults = data.data.map((item: any) => ({
                ...item,
                status: 'pending'
            }));
            setResults(initialResults);
            if (initialResults.length === 0) {
                setError('Extraction successful but no products found. Heuristics might need adjustment for this site.');
            }
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
        setResults(results.map((r: any) => ({ ...r, status })));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/scrape/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: results, sourceUrl: url, location, marketCategory })
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
        <div className="space-y-16 pb-24 max-w-[1400px] mx-auto px-4">
            {/* Page Header - Console V2 Style */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-slate-100 pb-10">
                <div className="space-y-4">
                    <nav className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Admin</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Data Engineering</span>
                        <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Extraction</span>
                    </nav>
                    <div className="relative">
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none flex flex-wrap items-baseline gap-x-4">
                            Pulse <span className="text-primary italic font-serif">Extraction</span>
                        </h1>
                        <div className="absolute -bottom-2 left-0 w-24 h-1.5 bg-primary rounded-full shadow-glow-sm" />
                    </div>
                </div>
                
                <div className="flex items-center gap-5 bg-white shadow-premium p-4 rounded-[2rem] border border-slate-50 ring-1 ring-slate-100/50 backdrop-blur-xl">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 text-primary flex items-center justify-center shadow-glow-sm animate-float">
                        <Zap size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Engine Status</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow animate-pulse" />
                            <p className="text-sm font-black text-slate-800 tracking-tight">Structural Parser <span className="text-primary">v2.5</span> Active</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Input Dashboard - Premium Glassmorphism */}
            <div className="relative">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 blur-[80px] rounded-full" />
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/10 blur-[80px] rounded-full" />
                
                <Card className="p-10 border border-white/40 shadow-premium bg-white/70 backdrop-blur-3xl rounded-[3rem] relative z-10 overflow-hidden ring-1 ring-slate-200/50">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                        <div className="lg:col-span-5 space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] px-3 flex items-center gap-3">
                                <LinkIcon size={14} className="text-primary" />
                                Target URL Protocol
                            </label>
                            <div className="relative group">
                                <Input
                                    type="url"
                                    value={url}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setUrl(val);
                                        const onlineDomains = ['jumia', 'konga', 'amazon', 'ebay', 'aliexpress', 'chowdeck', 'supermart'];
                                        if (onlineDomains.some((d: string) => val.toLowerCase().includes(d))) {
                                            setMarketCategory('Online');
                                        } else if (val.length > 5) {
                                            setMarketCategory('Physical');
                                        }
                                    }}
                                    placeholder="https://www.supermart.ng/collections/fresh-food"
                                    className="h-20 pl-8 pr-16 text-base font-bold bg-slate-50/50 border-transparent focus:bg-white focus:border-primary/30 transition-all rounded-[1.5rem] shadow-inner group-hover:bg-white/80 placeholder:text-slate-300"
                                    disabled={loading}
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-primary transition-colors">
                                    <Search size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3 space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] px-3 flex items-center gap-3">
                                <MapPin size={14} className="text-slate-400" />
                                Entity Origin (Location/Site)
                            </label>
                            <Input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder={marketCategory === 'Online' ? 'Supermart - Lagos' : 'Market Location'}
                                className="h-20 px-8 text-base font-bold bg-slate-50/50 border-transparent focus:bg-white focus:border-primary/30 transition-all rounded-[1.5rem] shadow-inner placeholder:text-slate-300"
                                disabled={loading}
                            />
                        </div>

                        <div className="lg:col-span-2 space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] px-3 flex items-center gap-3">
                                <Layers size={14} className="text-primary" />
                                Market Channel
                            </label>
                            <div className="h-20 flex bg-slate-100/50 p-2 rounded-[1.5rem] border border-slate-200/50 backdrop-blur-sm shadow-inner overflow-hidden">
                                <button
                                    onClick={() => setMarketCategory('Physical')}
                                    className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-500 ${marketCategory === 'Physical' ? 'bg-white text-slate-900 shadow-premium scale-95' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <MapPin size={16} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Physical</span>
                                </button>
                                <button
                                    onClick={() => setMarketCategory('Online')}
                                    className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-500 ${marketCategory === 'Online' ? 'bg-white text-slate-900 shadow-premium scale-95' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Activity size={16} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Online</span>
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <Button
                                onClick={handleExtract}
                                disabled={loading || !url}
                                className="w-full h-20 rounded-[1.5rem] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.25em] shadow-glow flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 group"
                            >
                                {loading ? (
                                    <RefreshCw className="animate-spin text-primary" size={24} />
                                ) : (
                                    <Sparkles size={24} className="text-primary group-hover:scale-125 transition-transform" />
                                )}
                                <span className="text-[10px]">{loading ? 'Analyzing' : 'Extract'}</span>
                            </Button>
                        </div>
                    </div>
                    
                    <div className="mt-10 pt-8 border-t border-slate-100 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center flex-shrink-0 text-primary">
                            <ShieldCheck size={20} />
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 leading-relaxed max-w-3xl">
                            <span className="text-slate-900">Advanced DOM Heuristics:</span> Proprietary structural DOM heuristics will parse the target page for product hierarchies, pricing tiers, and asset mapping. No API keys or pre-configured scrapers required. 
                            <span className="text-primary ml-2 italic">Optimized for Supermart.ng and leading Nigerian marketplaces.</span>
                        </p>
                    </div>
                </Card>
            </div>

            {/* Feedback Messages */}
            <div className="max-w-3xl mx-auto space-y-4">
                {error && (
                    <div className="p-6 bg-rose-50/80 backdrop-blur-md border border-rose-100 rounded-[2rem] flex items-center gap-5 animate-in fade-in slide-in-from-top-4 shadow-sm">
                        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-500 flex items-center justify-center flex-shrink-0 shadow-inner">
                            <XCircle size={24} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-rose-800 leading-relaxed">{error}</span>
                    </div>
                )}
                {successMsg && (
                    <div className="p-6 bg-emerald-50/80 backdrop-blur-md border border-emerald-100 rounded-[2rem] flex items-center gap-5 animate-in fade-in slide-in-from-top-4 shadow-sm">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-500 flex items-center justify-center flex-shrink-0 shadow-inner">
                            <CheckCircle2 size={24} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-800 leading-relaxed">{successMsg}</span>
                    </div>
                )}
            </div>

            {/* Results Table */}
            {results.length > 0 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out">
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-end px-6 gap-6">
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-3">
                                Parser <span className="text-primary">Registry</span>
                            </h2>
                            <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Identified Entities: <span className="text-slate-900">{results.length}</span></p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Button 
                                onClick={() => setAllStatus('approved')} 
                                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl px-8 h-14 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-glow-sm hover:scale-105 transition-all active:scale-95"
                            >
                                <Check size={18} />
                                Authorize All
                            </Button>
                            <Button 
                                onClick={() => setAllStatus('rejected')} 
                                className="bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-2xl px-8 h-14 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all active:scale-95"
                            >
                                <Trash2 size={18} />
                                Discard All
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-2xl rounded-[3.5rem] shadow-premium border border-slate-100 overflow-hidden ring-1 ring-slate-200/50">
                        <div className="overflow-x-auto max-h-[70vh] custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100 backdrop-blur-md sticky top-0 z-10">
                                        <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] w-28">Img</th>
                                        <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Product Name (Mutable)</th>
                                        <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Category</th>
                                        <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Price (₦)</th>
                                        <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Match Logic</th>
                                        <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {results.map((item, i) => (
                                        <tr key={i} className={`group hover:bg-slate-50/50 transition-all duration-500 ${item.status === 'rejected' ? 'opacity-30 grayscale' : ''}`}>
                                            <td className="px-10 py-8">
                                                <div className="w-20 h-20 rounded-[1.5rem] bg-slate-50 overflow-hidden border-2 border-slate-100 relative group-hover:border-primary/20 transition-all group-hover:scale-110 shadow-sm">
                                                    <Image 
                                                        src={item.imageUrl || `https://placehold.co/600x400/png?text=${encodeURIComponent(item.name)}`} 
                                                        alt={item.name} 
                                                        fill
                                                        sizes="80px"
                                                        className="object-contain p-2"
                                                        onError={() => {
                                                            const newResults = [...results];
                                                            newResults[i].imageUrl = `https://placehold.co/600x400/png?text=${encodeURIComponent(item.name)}`;
                                                            setResults(newResults);
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="relative group/input max-w-md">
                                                    <input
                                                        value={item.name}
                                                        onChange={e => handleUpdateResult(i, 'name', e.target.value)}
                                                        className="w-full bg-transparent border-none text-slate-900 font-black text-lg tracking-tight focus:ring-0 placeholder:text-slate-300 p-0 mb-1"
                                                    />
                                                    <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover/input:w-full transition-all duration-500 opacity-50" />
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Click to modify product title</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="inline-flex items-center gap-3 bg-slate-100/50 px-5 py-3 rounded-2xl group-hover:bg-white transition-all border border-transparent group-hover:border-slate-200/50 shadow-inner group-hover:shadow-premium">
                                                    <input
                                                        value={item.category || 'Uncategorized'}
                                                        onChange={e => handleUpdateResult(i, 'category', e.target.value)}
                                                        className="w-full bg-transparent border-none p-0 text-slate-600 font-black text-[10px] focus:ring-0 uppercase tracking-widest"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="inline-flex items-center gap-2 bg-slate-100/50 px-5 py-3 rounded-2xl group-hover:bg-white transition-all border border-transparent group-hover:border-slate-200/50 shadow-inner group-hover:shadow-premium">
                                                    <span className="text-primary font-black text-base">₦</span>
                                                    <input
                                                        type="number"
                                                        value={item.price}
                                                        onChange={e => handleUpdateResult(i, 'price', Number(e.target.value))}
                                                        className="w-28 bg-transparent border-none p-0 text-slate-900 font-black text-xl tracking-tighter focus:ring-0"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                {item.matchedProductId ? (
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shadow-sm animate-pulse">
                                                            <Database size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 text-sm tracking-tight truncate max-w-[220px]">{item.matchedProductName}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Match Strength: {((1 - item.matchScore) * 100).toFixed(0)}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-4 group/logic">
                                                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shadow-sm group-hover/logic:scale-110 transition-transform">
                                                            <Sparkles size={20} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] bg-amber-100/50 px-3 py-1.5 rounded-xl border border-amber-200/50">New Potential Entity</span>
                                                            <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">No mapping found in core registry</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => handleUpdateResult(i, 'status', item.status === 'approved' ? 'pending' : 'approved')}
                                                        className={`w-14 h-14 rounded-2xl transition-all shadow-premium flex items-center justify-center ${
                                                            item.status === 'approved' 
                                                            ? 'bg-emerald-500 text-white shadow-glow-sm scale-110' 
                                                            : 'bg-white text-slate-200 hover:text-emerald-500 border border-slate-100 hover:border-emerald-200'
                                                        }`}
                                                    >
                                                        <Check size={24} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateResult(i, 'status', item.status === 'rejected' ? 'pending' : 'rejected')}
                                                        className={`w-14 h-14 rounded-2xl transition-all shadow-premium flex items-center justify-center ${
                                                            item.status === 'rejected' 
                                                            ? 'bg-rose-500 text-white shadow-glow-sm scale-110' 
                                                            : 'bg-white text-slate-200 hover:text-rose-500 border border-slate-100 hover:border-rose-200'
                                                        }`}
                                                    >
                                                        <Trash2 size={24} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Registry Footer Actions */}
                        <div className="p-12 bg-slate-50/80 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between border-t border-slate-100 gap-8">
                            <div className="flex items-center gap-5 text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] max-w-md">
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-primary flex items-center justify-center shadow-glow-sm">
                                    <ShieldCheck size={24} />
                                </div>
                                <span>Security Protocol: Review and validate all entities before deploying to the production registry.</span>
                            </div>
                            
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || results.every(r => r.status === 'rejected')}
                                className="h-24 px-16 rounded-[2.5rem] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.3em] shadow-glow flex items-center gap-6 hover:scale-[1.03] active:scale-95 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                {loading ? (
                                    <>
                                        <RefreshCw className="animate-spin text-primary" size={28} />
                                        <span>Synchronizing Core...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-3 rounded-xl bg-white/10 group-hover:scale-110 transition-transform">
                                            <Layers className="text-primary" size={24} />
                                        </div>
                                        <span className="text-lg">Deploy Registry Updates</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State / Tips */}
            {!loading && results.length === 0 && !error && (
                <div className="text-center py-24 space-y-8 animate-in fade-in duration-1000">
                    <div className="w-24 h-24 rounded-[2rem] bg-slate-50 text-slate-200 flex items-center justify-center mx-auto border border-slate-100 animate-float">
                        <Box size={48} />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-slate-800">Registry Ready</h3>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest max-w-sm mx-auto leading-loose">Enter a target URL above to begin the structural pulse analysis and registry synchronization.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
