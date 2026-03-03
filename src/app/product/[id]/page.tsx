'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui-base';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import { use } from 'react';

interface Product {
    _id: string;
    name: string;
    price: number;
    category: string;
    imageUrl: string;
    lastUpdated: string;
}

interface Message {
    _id: string;
    content: string;
    isAdmin?: boolean;
    createdAt: string;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [product, setProduct] = useState<Product | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            const [productRes, messagesRes] = await Promise.all([
                fetch(`/api/products/${id}`), // Note: We need a GET endpoint for single product
                fetch(`/api/messages?productId=${id}`),
            ]);

            if (productRes.ok) {
                const productData = await productRes.json();
                if (productData.error) {
                    setError(productData.error);
                } else {
                    setProduct(productData);
                }
            } else {
                setError('Failed to fetch product');
            }

            if (messagesRes.ok) {
                const messagesData = await messagesRes.json();
                if (Array.isArray(messagesData)) {
                    setMessages(messagesData);
                }
            }
        } catch (error) {
            console.error('Failed to fetch data');
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setPosting(true);
        setError('');

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, productId: id }),
            });

            const data = await res.json();

            if (res.ok) {
                setContent('');
                fetchData();
            } else {
                setError(data.error || 'Failed to post message');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setPosting(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!product) {
        return <div className="min-h-screen flex items-center justify-center">Product not found.</div>;
    }

    return (
        <div className="min-h-screen bg-mesh selection:bg-primary/20">
            {/* Header */}
            <header className="glass sticky top-4 z-50 mx-4 mt-4 rounded-2xl shadow-premium">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="text-2xl font-black text-primary tracking-tighter hover:scale-105 transition-transform">
                        TrackPrice<span className="text-accent">.</span>
                    </Link>
                    <nav className="flex items-center gap-8">
                        <Link href="/" className="text-slate-600 hover:text-primary font-display font-semibold transition-colors relative group">
                            Back to Products
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Product Info Section */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-24 p-0 overflow-hidden border-none shadow-premium bg-white/40 glass">
                        <div className="relative h-80 w-full overflow-hidden">
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                            <div className="absolute top-4 right-4 glass px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-primary uppercase shadow-sm">
                                {product.category}
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-4">{product.name}</h1>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-slate-900 tracking-tighter">₦{product.price.toFixed(2)}</span>
                                    <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-md">LIVE PRICE</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-200/50 flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5">
                                    🕰️ UPDATED {formatRelativeTime(product.lastUpdated)}
                                </span>
                                <span className="flex items-center gap-1 text-primary">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    ACTIVE
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Discussion Section */}
                <div className="lg:col-span-2 space-y-12">
                    <section className="relative">
                        <Card className="glass !bg-white/40 border-white/60 p-8 relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shadow-inner">
                                        💬
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Product Discussion</h2>
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Post anonymously about this item</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="relative">
                                        <textarea
                                            className="w-full p-6 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 min-h-[140px] resize-none text-slate-700 text-lg placeholder:text-slate-300 shadow-inner"
                                            placeholder="What's your take on this price? (Max 300 characters)"
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            maxLength={300}
                                            required
                                        />
                                        <div className="absolute bottom-4 right-6 flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-300 tracking-tighter uppercase">
                                                {content.length} / 300
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" className="w-full sm:w-auto px-10 py-4 shadow-glow font-black tracking-wide" disabled={posting}>
                                            {posting ? 'PUBLISHING...' : 'POST MESSAGE'}
                                        </Button>
                                    </div>
                                    {error && (
                                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3">
                                            <p className="text-rose-600 text-sm font-bold">{error}</p>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </Card>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Recent Insights</h3>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{messages.length} Insights</span>
                        </div>

                        {messages.length === 0 ? (
                            <div className="text-center py-24 glass rounded-3xl border-2 border-dashed border-slate-200">
                                <h3 className="text-xl font-black text-slate-400">No discussions yet.</h3>
                                <p className="text-slate-300 font-bold uppercase text-[10px] tracking-widest mt-2">Be the first to analyze this product</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {messages.map((msg) => (
                                    <Card key={msg._id} className="relative group p-8 hover:shadow-glow transition-all duration-500 hover:-translate-y-1">
                                        <div className="flex gap-6 items-start">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex-shrink-0 flex items-center justify-center text-xl font-black text-slate-200 group-hover:bg-primary/5 group-hover:text-primary transition-colors duration-300">
                                                #
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-slate-700 text-lg leading-relaxed font-medium whitespace-pre-wrap antialiased">
                                                        {msg.content}
                                                    </p>
                                                    {msg.isAdmin && (
                                                        <span className="flex-shrink-0 bg-primary/10 text-primary text-[9px] font-black px-2 py-1 rounded-md tracking-tighter uppercase border border-primary/20 animate-pulse">
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="pt-4 border-t border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {formatRelativeTime(msg.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
