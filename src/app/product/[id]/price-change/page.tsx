'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui-base';
import { Navbar } from '@/components/Navbar';
import { formatPriceRange } from '@/lib/price-utils';
import { useProduct } from '@/hooks/useHomeData';
import { Users, AlertTriangle, ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function PriceChangePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { data, isLoading, refetch } = useProduct(id);
    const product = data?.product || null;

    const [newPrice, setNewPrice] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleConfirmPrice = async (updateId: string) => {
        try {
            const res = await fetch(`/api/products/${id}/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updateId })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                refetch();
            } else {
                alert(data.error || 'Failed to confirm price');
            }
        } catch (error) {
            console.error('Confirm failed', error);
        }
    };

    const handleUpdatePrice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product || !newPrice) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch(`/api/products/${product._id}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    price: newPrice
                }),
            });
            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: '✓ Price proposal submitted! Waiting for community consensus.' });
                setNewPrice('');
                refetch();
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to submit proposal.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'An error occurred while submitting.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-mesh">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-mesh">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <p className="text-slate-500 font-bold">Product not found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-mesh selection:bg-primary/20 pb-32">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <Link href={`/product/${product._id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm bg-white/50 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/50">
                        <ArrowLeft size={16} /> Back to Product
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Propose New Price */}
                    <div className="space-y-6">
                        <Card className="p-8 shadow-premium border-none bg-white/80 glass">
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Propose Price Change</h1>
                            <p className="text-slate-500 font-medium mb-6 text-sm">Have you seen a different price? Propose it here, and if others confirm, the official price will be updated.</p>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Official Price</p>
                                    <p className="text-xl font-black text-slate-800 tracking-tighter">{formatPriceRange(product.price, product.maxPrice)}</p>
                                </div>
                                {product.priceStatus === 'down' && <TrendingDown size={24} className="text-rose-600" />}
                                {product.priceStatus === 'up' && <TrendingUp size={24} className="text-emerald-600" />}
                            </div>

                            <form onSubmit={handleUpdatePrice} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                        <AlertTriangle size={12} className="text-primary" />
                                        Your Proposed Price (₦)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">₦</span>
                                        <input
                                            type="number"
                                            placeholder="Enter new price"
                                            value={newPrice}
                                            onChange={(e) => setNewPrice(e.target.value)}
                                            className="w-full pl-10 pr-4 py-4 rounded-2xl bg-white border border-slate-200 text-slate-800 font-black text-xl placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full shadow-glow py-4 text-sm font-black tracking-widest uppercase" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Proposal'}
                                </Button>

                                {message && (
                                    <p className={`text-[10px] font-black p-4 rounded-xl text-center uppercase tracking-widest ${message.type === 'success' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-rose-600 bg-rose-50 border border-rose-100'}`}>
                                        {message.text}
                                    </p>
                                )}
                            </form>
                        </Card>
                    </div>

                    {/* Right Column: Community Suggestions */}
                    <div className="space-y-6">
                        <Card className="p-8 shadow-premium border-none bg-slate-900 border border-slate-800 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
                            
                            <h2 className="text-xl font-black text-white tracking-tight mb-2 relative z-10 flex items-center gap-2">
                                <Users className="text-primary" size={20} />
                                Community Suggestions
                            </h2>
                            <p className="text-slate-400 font-medium mb-6 text-sm relative z-10">Confirm community proposed prices to help establish consensus.</p>

                            {(!product.suggestions || product.suggestions.length === 0) ? (
                                <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700/50 relative z-10">
                                    <Users size={32} className="mx-auto text-slate-600 mb-3" />
                                    <p className="text-sm font-bold text-slate-500">No active proposals right now.</p>
                                    <p className="text-[10px] font-black text-slate-600 tracking-widest uppercase mt-1">Be the first to propose</p>
                                </div>
                            ) : (
                                <div className="space-y-4 relative z-10">
                                    {product.suggestions.map((suggestion: any, idx: number) => (
                                        <div key={idx} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 hover:border-primary/30 transition-all duration-300">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-2xl font-black text-white tracking-tighter">{formatPriceRange(suggestion.price)}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proposed by <span className="text-primary">{suggestion.userName}</span></p>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                                                    <Users size={12} className="text-primary" />
                                                    <span className="text-xs font-black text-white">{suggestion.vouchCount || 0}</span>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleConfirmPrice(suggestion._id)}
                                                className="w-full bg-primary/20 hover:bg-primary text-primary hover:text-white font-black py-3 rounded-xl border border-primary/20 transition-all text-xs tracking-widest uppercase shadow-sm"
                                            >
                                                Confirm This Price
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
