'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui-base';
import { Navbar } from '@/components/Navbar';
import { MapPin, Store, ChevronRight, Info } from 'lucide-react';

export default function AddProductPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    
    // New Location States
    const [state, setState] = useState<'Oyo' | 'Lagos' | ''>('');
    const [selectedArea, setSelectedArea] = useState('');
    const [areas, setAreas] = useState<any[]>([]);
    const [storeType, setStoreType] = useState<'Market' | 'Supermarket'>('Market');
    const [specificStore, setSpecificStore] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [loadingAreas, setLoadingAreas] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Fetch areas when state changes
    useEffect(() => {
        if (!state) {
            setAreas([]);
            return;
        }

        const fetchAreas = async () => {
            setLoadingAreas(true);
            try {
                const res = await fetch(`/api/locations?state=${state}`);
                if (res.ok) {
                    const data = await res.json();
                    setAreas(data.areas);
                }
            } catch (error) {
                console.error('Failed to fetch areas', error);
            } finally {
                setLoadingAreas(false);
            }
        };

        fetchAreas();
    }, [state]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        // Construct a descriptive store location string for compatibility
        const storeLocation = `${specificStore ? specificStore + ', ' : ''}${selectedArea}, ${state} (${storeType})`;

        try {
            const res = await fetch('/api/user-products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name, 
                    category, 
                    price: Number(price), 
                    imageUrl, 
                    storeLocation,
                    marketCategory: storeType === 'Supermarket' ? 'Online' : 'Physical' // Mapping to existing logic
                })
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Product added successfully!' });
                setTimeout(() => router.push(`/product/${data.product._id}`), 2000);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to add product.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-mesh pb-32">
            <Navbar />
            <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Scanner</span>
                    <ChevronRight size={10} className="text-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">New Listing</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Add a New Product</h1>
                <p className="text-slate-500 font-medium mb-10">Help the community by documenting market prices in real-time.</p>

                {message && (
                    <div className={`p-4 rounded-2xl mb-8 font-bold text-sm shadow-premium flex items-center gap-3 animate-in zoom-in-95 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'success' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                            {message.type === 'success' ? '✓' : '!'}
                        </div>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <Card className="p-8 shadow-premium border-none bg-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50"></div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                            <Info size={16} className="text-primary" />
                            General Details
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Product Name</label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. 1kg Basmati Rice" className="h-14" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Category</label>
                                    <Input value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="e.g. Grains" className="h-14" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Today's Price (₦)</label>
                                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="e.g. 3500" className="h-14" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Location Info */}
                    <Card className="p-8 shadow-premium border-none bg-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-50"></div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                            <MapPin size={16} className="text-accent" />
                            Location Intelligence
                        </h2>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">State</label>
                                    <select
                                        value={state}
                                        onChange={(e) => {
                                            setState(e.target.value as any);
                                            setSelectedArea('');
                                        }}
                                        required
                                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    >
                                        <option value="">Select State</option>
                                        <option value="Oyo">Oyo</option>
                                        <option value="Lagos">Lagos</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Area</label>
                                    <select
                                        value={selectedArea}
                                        onChange={(e) => setSelectedArea(e.target.value)}
                                        required
                                        disabled={!state || loadingAreas}
                                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                                    >
                                        <option value="">{loadingAreas ? 'Loading...' : 'Select Area'}</option>
                                        {areas.map((a) => (
                                            <option key={a._id} value={a.name}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Store Type</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setStoreType('Market')}
                                        className={`h-14 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${
                                            storeType === 'Market' 
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-glow-sm' 
                                            : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                                        }`}
                                    >
                                        Local Market
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStoreType('Supermarket')}
                                        className={`h-14 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${
                                            storeType === 'Supermarket' 
                                            ? 'bg-primary text-white border-primary shadow-glow-sm' 
                                            : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                                        }`}
                                    >
                                        Supermarket
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                                    {storeType === 'Supermarket' ? 'Supermarket Name' : 'Specific Location (Optional)'}
                                </label>
                                <Input 
                                    value={specificStore} 
                                    onChange={(e) => setSpecificStore(e.target.value)} 
                                    placeholder={storeType === 'Supermarket' ? 'e.g. Shoprite' : 'e.g. Dugbe Market'} 
                                    className="h-14" 
                                />
                            </div>
                        </div>
                    </Card>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Visual Proof (Optional)</label>
                        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://image-link.com/photo.jpg" className="h-14" />
                    </div>

                    <div className="pt-6">
                        <Button type="submit" className="w-full py-6 text-xs font-black tracking-[0.3em] uppercase shadow-glow rounded-[2rem] active:scale-95 transition-all" disabled={submitting}>
                            {submitting ? 'Broadcasting Price...' : 'Submit to Market Registry'}
                        </Button>
                        <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-6">
                            By submitting, you earn <span className="text-primary">+20 reputation points</span>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
