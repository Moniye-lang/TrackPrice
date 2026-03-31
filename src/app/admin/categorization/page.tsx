'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Card } from '@/components/ui-base';
import { 
    Zap, 
    Box, 
    Filter, 
    CheckCircle2, 
    AlertCircle, 
    RefreshCw, 
    LayoutGrid, 
    Table as TableIcon,
    Globe,
    MapPin,
    Tag,
    Layers,
    Save,
    ChevronRight,
    Search,
    ShoppingBag,
    Cpu,
    Shirt,
    Home,
    BookOpen
} from 'lucide-react';

interface Product {
    _id: string;
    name: string;
    category: string;
    marketCategory?: 'Online' | 'Physical';
    storeLocation?: string;
    price: number;
    imageUrl: string;
}

export default function CategorizationPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'All' | 'Uncategorized' | 'Online' | 'Physical'>('Uncategorized');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const productCategories = ['Groceries', 'Electronics', 'Clothing', 'Home', 'Books', 'Oil and Gas', 'Other'];

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            if (Array.isArray(data)) {
                setProducts(data);
            }
        } catch (error) {
            console.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleUpdate = async (id: string, updates: Partial<Product>) => {
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                setProducts(products.map(p => p._id === id ? { ...p, ...updates } : p));
            }
        } catch (error) {
            console.error('Update failed');
        }
    };

    const handleBulkMarket = async (newMarket: 'Online' | 'Physical') => {
        const filtered = filteredProducts.map(p => p._id);
        if (filtered.length === 0) return;
        
        setSaving(true);
        try {
            // Sequential updates for safety, in a real app we'd use a bulk API endpoint
            for (const id of filtered) {
                await fetch(`/api/products/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ marketCategory: newMarket }),
                });
            }
            fetchProducts();
            setMessage({ type: 'success', text: `Successfully categorized ${filtered.length} products as ${newMarket}.` });
            setTimeout(() => setMessage(null), 5000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Bulk update failed.' });
        } finally {
            setSaving(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.category.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (filter === 'Uncategorized') return matchesSearch && !p.marketCategory;
        if (filter === 'Online') return matchesSearch && p.marketCategory === 'Online';
        if (filter === 'Physical') return matchesSearch && p.marketCategory === 'Physical';
        return matchesSearch;
    });

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
                <div>
                     <nav className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Database Hub</span>
                    </nav>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        Categorization <span className="text-primary italic">Engine</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                   <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="flex -space-x-2">
                             <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[10px] font-black text-white">
                                {products.length}
                             </div>
                             <div className="w-8 h-8 rounded-full bg-primary border-2 border-white flex items-center justify-center text-[10px] font-black text-white">
                                {products.filter(p => !p.marketCategory).length}
                             </div>
                        </div>
                        <div className="pr-4 border-r border-slate-100 mr-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Uncategorized</p>
                            <p className="text-xs font-bold text-slate-700">{products.filter(p => !p.marketCategory).length} Entities</p>
                        </div>
                        <Button onClick={fetchProducts} className="p-2 hover:bg-slate-50 rounded-xl bg-transparent text-slate-400">
                            <RefreshCw size={18} className={loading ? 'animate-spin text-primary' : 'text-slate-400'} />
                        </Button>
                   </div>
                </div>
            </div>

            {message && (
                <div className={`p-6 rounded-3xl border flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500 ${
                    message.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm' 
                    : 'bg-rose-50 text-rose-700 border-rose-100 shadow-sm'
                }`}>
                    <div className="flex items-center gap-4">
                        {message.type === 'success' ? <CheckCircle2 className="text-emerald-500" /> : <AlertCircle className="text-rose-500" />}
                        <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
                    </div>
                    <Button onClick={() => setMessage(null)} className="p-1 bg-transparent text-slate-400"><ChevronRight size={16} /></Button>
                </div>
            )}

            {/* Toolbar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-4 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                    <Input 
                        placeholder="Search for products to categorize..." 
                        className="h-16 pl-16 pr-6 rounded-2xl bg-white border-transparent focus:border-primary shadow-premium transition-all font-bold text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="lg:col-span-4 flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    {(['Uncategorized', 'Online', 'Physical', 'All'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                filter === t 
                                ? 'bg-slate-900 text-white shadow-lg' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="lg:col-span-4 flex items-center justify-end gap-3">
                    <Button
                        onClick={() => handleBulkMarket('Physical')}
                        disabled={saving || filteredProducts.length === 0}
                        className="flex-1 lg:flex-none h-16 px-6 rounded-2xl bg-white border-2 border-slate-100 text-slate-700 font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        <MapPin size={18} />
                        Bulk Physical
                    </Button>
                    <Button
                        onClick={() => handleBulkMarket('Online')}
                        disabled={saving || filteredProducts.length === 0}
                        className="flex-1 lg:flex-none h-16 px-6 rounded-2xl bg-white border-2 border-slate-100 text-slate-700 font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        <Globe size={18} />
                        Bulk Online
                    </Button>
                </div>
            </div>

            {/* Product List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-64 bg-white/50 rounded-[2.5rem] animate-pulse border border-slate-100" />
                    ))
                ) : filteredProducts.length === 0 ? (
                    <div className="md:col-span-2 xl:col-span-3 py-32 flex flex-col items-center gap-6 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-premium border border-slate-100 relative overflow-hidden group">
                           <div className="absolute inset-0 bg-primary/5 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full" />
                           <Box size={40} className="text-slate-200 relative z-10 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black text-slate-700 tracking-tight">Registry Clean</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">No products matching current filter parameters</p>
                        </div>
                        <Button onClick={() => { setFilter('All'); setSearchTerm(''); }} variant="secondary" className="px-8 py-3 rounded-xl border border-slate-200 font-black uppercase tracking-widest text-[9px]">
                            Reset Filter Stack
                        </Button>
                    </div>
                ) : (
                    filteredProducts.map((p) => (
                        <Card key={p._id} className="p-8 border-none shadow-premium bg-white rounded-[2.5rem] group relative overflow-hidden hover:-translate-y-1 transition-all duration-300">
                            {/* Market Status Badge */}
                            <div className="absolute top-6 right-6">
                                {p.marketCategory ? (
                                    <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
                                        p.marketCategory === 'Online' 
                                        ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    }`}>
                                        {p.marketCategory}
                                    </div>
                                ) : (
                                    <div className="px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-[8px] font-black uppercase tracking-widest animate-pulse">
                                        Pending Assignment
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-6 items-start mb-8">
                                <div className="w-20 h-20 rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 shadow-sm relative group-hover:scale-105 transition-transform duration-500">
                                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0 pr-12">
                                    <h4 className="font-black text-slate-900 text-lg tracking-tight mb-1 truncate leading-tight">{p.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={10} className="text-slate-300" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{p.storeLocation || 'Local Vendor'}</p>
                                    </div>
                                    <p className="text-xl font-black text-primary tracking-tighter mt-2">₦{p.price.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Market Categorization */}
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Market Logic</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleUpdate(p._id, { marketCategory: 'Physical' })}
                                            className={`py-3 rounded-2xl flex items-center justify-center gap-2 transition-all border ${
                                                p.marketCategory === 'Physical'
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-glow-sm'
                                                : 'bg-slate-50 text-slate-400 border-transparent hover:bg-white hover:border-slate-200'
                                            }`}
                                        >
                                            <MapPin size={14} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Physical</span>
                                        </button>
                                        <button
                                            onClick={() => handleUpdate(p._id, { marketCategory: 'Online' })}
                                            className={`py-3 rounded-2xl flex items-center justify-center gap-2 transition-all border ${
                                                p.marketCategory === 'Online'
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-glow-sm'
                                                : 'bg-slate-50 text-slate-400 border-transparent hover:bg-white hover:border-slate-200'
                                            }`}
                                        >
                                            <Globe size={14} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Online</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Product Category */}
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Product Taxonomy</p>
                                    <div className="relative group/select">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/select:text-primary transition-colors" size={14} />
                                        <select
                                            value={p.category}
                                            onChange={(e) => handleUpdate(p._id, { category: e.target.value })}
                                            className="w-full bg-slate-50 border border-transparent rounded-2xl py-3 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest focus:bg-white focus:border-primary focus:ring-0 outline-none cursor-pointer appearance-none transition-all"
                                        >
                                            {productCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 rotate-90" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className={`text-[8px] font-black uppercase tracking-widest ${p.marketCategory ? 'text-emerald-500' : 'text-slate-300'}`}>
                                    {p.marketCategory ? 'Sync Ready' : 'Awaiting Data'}
                                </span>
                                <Button className="p-2 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors bg-transparent text-slate-300">
                                    <Save size={16} />
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
