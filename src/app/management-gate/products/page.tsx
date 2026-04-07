'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui-base';
import { formatPriceRange } from '@/lib/price-utils';

interface Product {
    _id: string;
    name: string;
    price: number;
    maxPrice?: number;
    category: string;
    marketCategory?: 'Online' | 'Physical';
    imageUrl: string;
    storeLocation?: string;
    lastUpdated: string;
    isFeatured?: boolean;
}

import { 
    Plus, 
    Search, 
    Image as ImageIcon, 
    Edit2, 
    Trash2, 
    Copy, 
    GitMerge, 
    Star, 
    X, 
    Folder, 
    MapPin, 
    Tag,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Activity,
    Box,
    Globe
} from 'lucide-react';
import { useAdminProducts } from '@/hooks/useAdmin';

function SafeProductImg({ imageUrl, name, sizes }: { imageUrl: string; name: string; sizes: string }) {
    const [err, setErr] = useState(false);
    const valid = imageUrl && imageUrl.length > 5 && !err && !imageUrl.includes('placehold.co');
    return valid ? (
        <Image src={imageUrl} alt={name} fill sizes={sizes} className="object-cover" onError={() => setErr(true)} />
    ) : (
        <span className="text-2xl" aria-hidden="true">📦</span>
    );
}

export default function AdminProducts() {
    const searchParams = useSearchParams();
    const { data: productsData = [], isLoading: loading, refetch } = useAdminProducts();
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [autoImageLoading, setAutoImageLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form states
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [marketCategory, setMarketCategory] = useState<'Online' | 'Physical' | ''>('');
    const [imageUrl, setImageUrl] = useState('');
    const [storeLocation, setStoreLocation] = useState('');

    useEffect(() => {
        const nameParam = searchParams.get('name');
        const catParam = searchParams.get('category');
        const brandParam = searchParams.get('brand');

        if (nameParam || catParam || brandParam) {
            setName(nameParam || '');
            setCategory(catParam || '');
            setShowForm(true);
        }
    }, [searchParams]);

    const filteredProducts = (productsData as Product[]).filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.storeLocation || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        const payload = { name, price, category, marketCategory: marketCategory || undefined, imageUrl, storeLocation };

        try {
            const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products';
            const method = editingProduct ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                setShowForm(false);
                setEditingProduct(null);
                resetForm();
                refetch();
            } else {
                setError(data.error || data.details || 'Failed to save product');
            }
        } catch (error) {
            console.error('Failed to save product');
            setError('An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAutoImages = async () => {
        setAutoImageLoading(true);
        try {
            const res = await fetch('/api/admin/products/auto-images', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                refetch();
            } else {
                alert(data.error || 'Failed to auto-fetch images');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred during auto-fetching.');
        } finally {
            setAutoImageLoading(false);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setName(product.name);
        setPrice(product.price.toString());
        setCategory(product.category);
        setMarketCategory(product.marketCategory || '');
        setImageUrl(product.imageUrl);
        setStoreLocation(product.storeLocation || '');
        setShowForm(true);
    };

    const handleDuplicate = async (id: string) => {
        if (!confirm('Are you sure you want to duplicate this product?')) return;
        try {
            const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: 'POST' });
            if (res.ok) {
                refetch();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to duplicate product');
            }
        } catch (error) {
            console.error('Failed to duplicate product');
        }
    };

    const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);

    const handleMerge = async (targetId: string) => {
        if (!mergeSourceId || mergeSourceId === targetId) return;
        if (!confirm('Merge all price updates and messages from the source product into this one? The source product will be DELETED.')) return;
        try {
            const res = await fetch('/api/admin/products/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceId: mergeSourceId, targetId }),
            });
            if (res.ok) {
                setMergeSourceId(null);
                refetch();
            } else {
                const data = await res.json();
                alert(data.error || 'Merge failed');
            }
        } catch (error) {
            console.error('Merge failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (res.ok) refetch();
        } catch (error) {
            console.error('Failed to delete product');
        }
    };

    const resetForm = () => {
        setName('');
        setPrice('');
        setCategory('');
        setMarketCategory('');
        setImageUrl('');
        setStoreLocation('');
    };

    return (
        <div className="space-y-12">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                     <nav className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Inventory</span>
                    </nav>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
                        Managed <span className="text-primary italic">Catalogue</span>
                    </h1>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <Button 
                        onClick={handleAutoImages} 
                        disabled={autoImageLoading} 
                        variant="secondary"
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2 px-6 py-3 rounded-2xl transition-all"
                    >
                        <RefreshCw size={16} className={autoImageLoading ? 'animate-spin' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Auto-Fetch Images</span>
                    </Button>
                    <Button 
                        onClick={() => { setShowForm(true); setEditingProduct(null); resetForm(); }}
                        className="bg-primary hover:bg-primary/90 text-white shadow-glow flex items-center justify-center gap-2 px-6 py-3 rounded-2xl transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Add Product</span>
                    </Button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="relative group w-full lg:max-w-xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Search catalogue..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-100 py-4 md:py-5 pl-16 pr-6 rounded-[1.5rem] md:rounded-3xl shadow-premium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all font-bold text-slate-700 text-sm placeholder:text-slate-300"
                    aria-label="Search catalogue"
                />
            </div>

            {showForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setShowForm(false)} />
                    <Card className="max-w-2xl w-full p-6 md:p-10 relative z-10 animate-in zoom-in-95 duration-300 border-none shadow-premium-lg rounded-3xl md:rounded-[2.5rem] bg-white max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <button 
                            onClick={() => setShowForm(false)}
                            className="absolute top-4 right-4 md:top-8 md:right-8 p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                        >
                            <X size={20} />
                        </button>
                        
                        <div className="mb-10 text-center">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                {editingProduct ? 'Update Product' : 'Catalogue Addition'}
                            </h2>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Enter product parameters below</p>
                        </div>

                        {error && (
                            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}
                        
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                                    <Tag size={12} className="text-primary" />
                                    Product Name
                                </label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Rice 50kg (Local)" className="rounded-2xl py-4" />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                                    <Activity size={12} className="text-primary" />
                                    Price Reference
                                </label>
                                <Input value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="1000 or 1000-2000" className="rounded-2xl py-4" />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                                    <Folder size={12} className="text-primary" />
                                    Category
                                </label>
                                <Input value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="e.g. Groceries" className="rounded-2xl py-4" />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                                    <Globe size={12} className="text-primary" />
                                    Market Category
                                </label>
                                <select 
                                    value={marketCategory} 
                                    onChange={(e) => setMarketCategory(e.target.value as any)}
                                    className="w-full h-14 px-4 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 font-bold"
                                >
                                    <option value="">Select Category</option>
                                    <option value="Physical">Physical Market</option>
                                    <option value="Online">Online Store</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                                    <ImageIcon size={12} className="text-primary" />
                                    Hero Image URL
                                </label>
                                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required placeholder="https://..." className="rounded-2xl py-4" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                                    <MapPin size={12} className="text-primary" />
                                    Primary Store / Market
                                </label>
                                <Input value={storeLocation} onChange={(e) => setStoreLocation(e.target.value)} placeholder="e.g. Bodija Market, Ibadan" className="rounded-2xl py-4" />
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-3 mt-8">
                                <Button type="submit" disabled={submitting} className="w-full py-4 md:py-5 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-glow">
                                    {submitting ? 'Processing...' : editingProduct ? 'Commit Update' : 'Add to Catalogue'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="animate-pulse flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Querying Catalogue Database</p>
                </div>
            ) : (
                <div className="space-y-6 pb-20">
                    {/* Mobile View: Cards */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {filteredProducts.map((product) => (
                            <Card key={product._id} className="p-5 border-none shadow-premium bg-white rounded-3xl group relative">
                                <div className="flex gap-4">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 shadow-sm relative flex items-center justify-center">
                                        <SafeProductImg imageUrl={product.imageUrl} name={product.name} sizes="80px" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="font-black text-slate-900 text-sm tracking-tight leading-tight line-clamp-2">{product.name}</p>
                                            <button
                                                onClick={async () => {
                                                    const res = await fetch(`/api/products/${product._id}`, {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ isFeatured: !product.isFeatured }),
                                                    });
                                                    if (res.ok) refetch();
                                                }}
                                                className={`flex-shrink-0 transition-all ${product.isFeatured ? 'text-primary' : 'text-slate-200'}`}
                                            >
                                                <Star size={18} fill={product.isFeatured ? 'currentColor' : 'none'} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <MapPin size={10} className="text-slate-300" />
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{product.storeLocation || 'Unassigned Depot'}</p>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <p className="font-black text-slate-900 text-sm">{formatPriceRange(product.price, product.maxPrice)}</p>
                                            <div className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                                {product.category}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between gap-2">
                                    {mergeSourceId ? (
                                        mergeSourceId === product._id ? (
                                            <button onClick={() => setMergeSourceId(null)} className="flex-1 py-3 rounded-xl bg-rose-50 text-rose-500 font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
                                                <X size={14} /> Abort Merge
                                            </button>
                                        ) : (
                                            <button onClick={() => handleMerge(product._id)} className="flex-1 py-3 rounded-xl bg-emerald-50 text-emerald-500 font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
                                                <GitMerge size={14} /> Commit Merge
                                            </button>
                                        )
                                    ) : (
                                        <div className="grid grid-cols-4 gap-2 w-full">
                                            <button onClick={() => setMergeSourceId(product._id)} className="p-3 rounded-xl bg-slate-50 text-slate-600 flex justify-center hover:bg-primary hover:text-white transition-all">
                                                <GitMerge size={16} />
                                            </button>
                                            <button onClick={() => handleDuplicate(product._id)} className="p-3 rounded-xl bg-slate-50 text-slate-600 flex justify-center hover:bg-primary hover:text-white transition-all">
                                                <Copy size={16} />
                                            </button>
                                            <button onClick={() => handleEdit(product)} className="p-3 rounded-xl bg-slate-50 text-slate-600 flex justify-center hover:bg-primary hover:text-white transition-all">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(product._id)} className="p-3 rounded-xl bg-rose-50 text-rose-500 flex justify-center hover:bg-rose-500 hover:text-white transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Desktop View: Table */}
                    <Card className="hidden md:block p-0 border-none shadow-premium bg-white overflow-hidden rounded-[2.5rem]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-50">
                                    <tr>
                                        <th className="py-6 px-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Product Blueprint</th>
                                        <th className="py-6 px-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Taxonomy</th>
                                        <th className="py-6 px-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Market Value</th>
                                        <th className="py-6 px-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                                        <th className="py-6 px-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product) => (
                                        <tr key={product._id} className="border-b border-slate-50 group hover:bg-slate-50/30 transition-all">
                                            <td className="py-6 px-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 shadow-sm relative flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                                        <SafeProductImg imageUrl={product.imageUrl} name={product.name} sizes="64px" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm tracking-tight leading-tight mb-1">{product.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin size={10} className="text-slate-300" />
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.storeLocation || 'Unassigned Depot'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest w-fit">
                                                    {product.category}
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <p className="font-black text-slate-900">{formatPriceRange(product.price, product.maxPrice)}</p>
                                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">
                                                    Updated {new Date(product.lastUpdated).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="py-6 px-8 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <button
                                                        onClick={async () => {
                                                            const res = await fetch(`/api/products/${product._id}`, {
                                                                method: 'PUT',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ isFeatured: !product.isFeatured }),
                                                            });
                                                            if (res.ok) refetch();
                                                        }}
                                                        className={`w-10 h-6 rounded-full transition-all relative ${product.isFeatured ? 'bg-primary shadow-glow-sm' : 'bg-slate-200'}`}
                                                    >
                                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${product.isFeatured ? 'left-5' : 'left-1'}`} />
                                                    </button>
                                                    <span className={`text-[7px] font-black uppercase tracking-widest ${product.isFeatured ? 'text-primary' : 'text-slate-400'}`}>
                                                        {product.isFeatured ? 'Featured' : 'Standard'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8 text-right space-x-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    {mergeSourceId ? (
                                                        mergeSourceId === product._id ? (
                                                            <button onClick={() => setMergeSourceId(null)} className="p-2.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center gap-2 px-4 group">
                                                                <X size={16} />
                                                                <span className="text-[8px] font-black uppercase tracking-widest">Abort Merge</span>
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => handleMerge(product._id)} className="p-2.5 rounded-xl bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center gap-2 px-4 group">
                                                                <GitMerge size={16} />
                                                                <span className="text-[8px] font-black uppercase tracking-widest">Commit Merge</span>
                                                            </button>
                                                        )
                                                    ) : (
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                            <button onClick={() => setMergeSourceId(product._id)} className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-primary transition-all shadow-sm" title="Merge Logic">
                                                                <GitMerge size={14} />
                                                            </button>
                                                            <button onClick={() => handleDuplicate(product._id)} className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-primary transition-all shadow-sm" title="Clone Entry">
                                                                <Copy size={14} />
                                                            </button>
                                                            <button onClick={() => handleEdit(product)} className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-primary transition-all shadow-sm" title="Edit Parameters">
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button onClick={() => handleDelete(product._id)} className="p-2.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="Purge Record">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Box size={40} className="text-slate-100" />
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No matching blueprints found</p>
                                                    <Button 
                                                        variant="secondary" 
                                                        onClick={() => setSearchTerm('')}
                                                        className="mt-2 text-[8px] font-black uppercase underline decoration-primary decoration-2 underline-offset-4"
                                                    >
                                                        Clear Filter Stack
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
