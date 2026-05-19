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
    ExternalLink,
    ChevronRight,
    Sparkles,
    Trash2,
    Check,
    X,
    Box,
    Plus,
    Activity
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
        <div className="space-y-10 pb-20 max-w-6xl mx-auto px-4">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-8">
                <div>
                    <nav className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Inventory</span>
                    </nav>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        Product <span className="text-primary italic">Extraction</span>
                    </h1>
                </div>
                
                <div className="flex items-center gap-4 bg-white shadow-sm p-3 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-primary flex items-center justify-center border border-slate-100">
                        <Zap size={20} />
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Scraper Engine</p>
                        <p className="text-[10px] font-bold text-slate-700">Structural Analysis Active</p>
                    </div>
                </div>
            </div>

            {/* Input Card */}
            <Card className="p-8 border-none shadow-premium bg-white rounded-[2rem]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                    <div className="lg:col-span-5 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                            <LinkIcon size={12} className="text-primary" />
                            Target URL
                        </label>
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
                            className="h-14 px-5 font-bold rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all"
                            disabled={loading}
                        />
                    </div>

                    <div className="lg:col-span-3 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                            <MapPin size={12} />
                            Store Location
                        </label>
                        <Input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Supermart - Lagos"
                            className="h-14 px-5 font-bold rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all"
                            disabled={loading}
                        />
                    </div>

                    <div className="lg:col-span-2 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                            <Layers size={12} />
                            Market Type
                        </label>
                        <select 
                            value={marketCategory}
                            onChange={(e) => setMarketCategory(e.target.value as any)}
                            className="w-full h-14 px-4 bg-slate-50/50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold text-sm"
                            disabled={loading}
                        >
                            <option value="Physical">Physical Market</option>
                            <option value="Online">Online Store</option>
                        </select>
                    </div>

                    <div className="lg:col-span-2">
                        <Button
                            onClick={handleExtract}
                            disabled={loading || !url}
                            className="w-full h-14 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-glow flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} className="text-primary" />}
                            <span className="text-[10px]">{loading ? 'Extracting...' : 'Extract Data'}</span>
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Status Messages */}
            {(error || successMsg) && (
                <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-top-2">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3">
                            <XCircle size={18} />
                            <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center gap-3">
                            <CheckCircle2 size={18} />
                            <p className="text-[10px] font-black uppercase tracking-widest">{successMsg}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Results Table */}
            {results.length > 0 && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex justify-between items-center px-2">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Extracted Items</h2>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Found {results.length} matching entities</p>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                onClick={() => setAllStatus('approved')} 
                                className="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 rounded-xl px-4 h-10 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all"
                            >
                                <Check size={14} /> Approve All
                            </Button>
                            <Button 
                                onClick={() => setAllStatus('rejected')} 
                                className="bg-slate-50 text-slate-400 border border-slate-100 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 rounded-xl px-4 h-10 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all"
                            >
                                <Trash2 size={14} /> Discard All
                            </Button>
                        </div>
                    </div>

                    <Card className="p-0 border-none shadow-premium bg-white overflow-hidden rounded-[2.5rem]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-50">
                                    <tr>
                                        <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest w-20">Asset</th>
                                        <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Product Details</th>
                                        <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                        <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Price (₦)</th>
                                        <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Match Result</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {results.map((item, i) => (
                                        <tr key={i} className={`group transition-all ${item.status === 'rejected' ? 'opacity-40 grayscale' : ''}`}>
                                            <td className="px-8 py-6">
                                                <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden relative flex items-center justify-center">
                                                    {item.imageUrl ? (
                                                        <Image 
                                                            src={item.imageUrl} 
                                                            alt={item.name} 
                                                            fill
                                                            sizes="56px"
                                                            unoptimized={item.imageUrl?.includes('placehold.co') || item.imageUrl?.startsWith('http') || item.imageUrl?.startsWith('//')}
                                                            className="object-contain p-1"
                                                            onError={() => handleUpdateResult(i, 'imageUrl', '')}
                                                        />
                                                    ) : (
                                                        <Box size={24} className="text-slate-200" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <input
                                                    value={item.name}
                                                    onChange={e => handleUpdateResult(i, 'name', e.target.value)}
                                                    className="w-full bg-transparent border-none text-slate-900 font-black text-sm tracking-tight p-0 focus:ring-0"
                                                />
                                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Entity Name</p>
                                            </td>
                                            <td className="px-6 py-6">
                                                <input
                                                    value={item.category || 'Uncategorized'}
                                                    onChange={e => handleUpdateResult(i, 'category', e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-slate-500 font-black text-[10px] focus:ring-0 uppercase tracking-widest"
                                                />
                                            </td>
                                            <td className="px-6 py-6 font-black text-slate-900">
                                                <div className="flex items-center gap-1">
                                                    <span>₦</span>
                                                    <input
                                                        type="number"
                                                        value={item.price}
                                                        onChange={e => handleUpdateResult(i, 'price', Number(e.target.value))}
                                                        className="w-20 bg-transparent border-none p-0 text-slate-900 font-black focus:ring-0"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                {item.matchedProductId ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
                                                            <Database size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 text-[11px] truncate max-w-[150px]">{item.matchedProductName}</p>
                                                            <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Matched {((1 - item.matchScore) * 100).toFixed(0)}%</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                                                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">New Entity</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleUpdateResult(i, 'status', item.status === 'approved' ? 'pending' : 'approved')}
                                                        className={`p-2.5 rounded-xl transition-all ${
                                                            item.status === 'approved' 
                                                            ? 'bg-emerald-500 text-white shadow-glow-sm' 
                                                            : 'bg-slate-50 text-slate-300 hover:text-emerald-500 border border-slate-100'
                                                        }`}
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateResult(i, 'status', item.status === 'rejected' ? 'pending' : 'rejected')}
                                                        className={`p-2.5 rounded-xl transition-all ${
                                                            item.status === 'rejected' 
                                                            ? 'bg-rose-500 text-white shadow-glow-sm' 
                                                            : 'bg-slate-50 text-slate-300 hover:text-rose-500 border border-slate-100'
                                                        }`}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4 text-slate-400">
                                <ShieldCheck size={20} />
                                <p className="text-[9px] font-bold uppercase tracking-widest max-w-sm">Review all extracted items for accuracy before committing to the product registry.</p>
                            </div>
                            
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || results.every(r => r.status === 'rejected')}
                                className="h-16 px-10 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-glow flex items-center gap-3 hover:bg-slate-800 transition-all active:scale-95"
                            >
                                {loading ? <RefreshCw className="animate-spin text-primary" size={20} /> : <Plus size={20} className="text-primary" />}
                                <span className="text-sm">Commit Registry Updates</span>
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Empty State */}
            {!loading && results.length === 0 && !error && (
                <div className="text-center py-24 border-2 border-dashed border-slate-100 rounded-[3rem]">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <Box size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Ready for Extraction</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Enter a store URL above to begin the data mapping process.</p>
                </div>
            )}
        </div>
    );
}
