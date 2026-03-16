'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui-base';
import { Navbar } from '@/components/Navbar';
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
    confidenceLevel?: 'Low' | 'Medium' | 'High';
    reportCount?: number;
    flagged?: boolean;
}

interface Message {
    _id: string;
    content: string;
    isAdmin?: boolean;
    parentId?: string;
    replyToContent?: string;
    createdAt: string;
}

interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [product, setProduct] = useState<Product | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    // Auth state
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Verify existing price
    const [verifying, setVerifying] = useState(false);
    const [verifyMsg, setVerifyMsg] = useState('');

    // Update price (propose a new price)
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [newPrice, setNewPrice] = useState('');
    const [updatingPrice, setUpdatingPrice] = useState(false);
    const [updateMsg, setUpdateMsg] = useState('');

    useEffect(() => {
        const fetchAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setAuthUser(data.user);
                }
            } catch {
                // not logged in
            } finally {
                setAuthLoading(false);
            }
        };
        fetchAuth();
    }, []);

    const fetchData = async () => {
        try {
            const [productRes, messagesRes] = await Promise.all([
                fetch(`/api/products/${id}`),
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

    // Verify = confirm the existing price is correct
    const handleVerifyPrice = async () => {
        if (!product) return;
        setVerifying(true);
        setVerifyMsg('');

        try {
            const res = await fetch(`/api/products/${product._id}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: product.price }),
            });
            const data = await res.json();

            if (res.ok) {
                setVerifyMsg('✓ Thank you! Price confirmed.');
                fetchData();
            } else {
                setVerifyMsg(data.error || 'Failed to verify price.');
            }
        } catch (err) {
            setVerifyMsg('An error occurred while verifying.');
        } finally {
            setVerifying(false);
        }
    };

    // Update = propose a different price
    const handleUpdatePrice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product || !newPrice) return;
        setUpdatingPrice(true);
        setUpdateMsg('');

        try {
            const res = await fetch(`/api/products/${product._id}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: Number(newPrice) }),
            });
            const data = await res.json();

            if (res.ok) {
                setUpdateMsg('✓ Price update submitted! It will be verified by the community.');
                setNewPrice('');
                setShowUpdateForm(false);
                fetchData();
            } else {
                setUpdateMsg(data.error || 'Failed to submit update.');
            }
        } catch (err) {
            setUpdateMsg('An error occurred.');
        } finally {
            setUpdatingPrice(false);
        }
    };

    const handleSubmitMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setPosting(true);
        setError('');

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    productId: id,
                    parentId: replyingTo?._id
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setContent('');
                setReplyingTo(null);
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
        return (
            <div className="min-h-screen bg-mesh">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="font-bold text-slate-500">Loading product...</p>
                    </div>
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
        <div className="min-h-screen bg-mesh selection:bg-primary/20">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Product Info Section */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-24 p-0 overflow-hidden border-none shadow-premium bg-white/40 glass">
                        <div className="relative h-72 w-full overflow-hidden">
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                            <div className="absolute top-4 right-4 glass px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-primary uppercase shadow-sm">
                                {product.category}
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight mb-3">{product.name}</h1>
                                <div className="flex flex-wrap items-baseline gap-3 mb-3">
                                    <span className="text-5xl font-black text-slate-900 tracking-tighter">₦{product.price.toFixed(2)}</span>
                                    {product.flagged ? (
                                        <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md border border-rose-200">FLAGGED</span>
                                    ) : product.confidenceLevel === 'High' ? (
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">VERIFIED</span>
                                    ) : (
                                        <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">ESTIMATE</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-sm font-medium text-slate-500 mb-5">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-2.5 h-2.5 rounded-full ${product.confidenceLevel === 'High' ? 'bg-emerald-500' :
                                            product.confidenceLevel === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
                                            }`} />
                                        {product.confidenceLevel || 'Low'} Confidence
                                    </div>
                                    <div>👥 {product.reportCount || 0} Reports</div>
                                </div>

                                {/* Price Action Buttons — Auth aware */}
                                {!authLoading && (
                                    <div className="space-y-3">
                                        {authUser ? (
                                            <>
                                                {/* Verify existing price */}
                                                <Button
                                                    onClick={handleVerifyPrice}
                                                    disabled={verifying}
                                                    variant="glass"
                                                    className="w-full py-3 text-sm font-black tracking-wide"
                                                >
                                                    {verifying ? 'Confirming...' : '✓ Confirm This Price'}
                                                </Button>
                                                {verifyMsg && (
                                                    <p className={`text-sm font-bold p-3 rounded-xl border ${verifyMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                                        {verifyMsg}
                                                    </p>
                                                )}

                                                {/* Suggest a different price */}
                                                {!showUpdateForm ? (
                                                    <Button
                                                        onClick={() => { setShowUpdateForm(true); setUpdateMsg(''); }}
                                                        className="w-full py-3 text-sm font-black tracking-wide shadow-glow"
                                                    >
                                                        📝 Update Price
                                                    </Button>
                                                ) : (
                                                    <form onSubmit={handleUpdatePrice} className="space-y-3 p-4 bg-white/60 rounded-2xl border border-primary/20 shadow-inner">
                                                        <p className="text-xs font-black text-primary uppercase tracking-widest">Suggest New Price</p>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            placeholder={`Current: ₦${product.price.toFixed(2)}`}
                                                            value={newPrice}
                                                            onChange={(e) => setNewPrice(e.target.value)}
                                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-bold text-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition"
                                                            required
                                                        />
                                                        {updateMsg && (
                                                            <p className={`text-xs font-bold p-2 rounded-lg ${updateMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                {updateMsg}
                                                            </p>
                                                        )}
                                                        <div className="flex gap-2">
                                                            <Button type="button" variant="secondary" className="flex-1 text-xs py-2 font-bold" onClick={() => setShowUpdateForm(false)}>
                                                                Cancel
                                                            </Button>
                                                            <Button type="submit" className="flex-1 text-xs py-2 font-bold shadow-glow" disabled={updatingPrice}>
                                                                {updatingPrice ? 'Submitting...' : 'Submit'}
                                                            </Button>
                                                        </div>
                                                    </form>
                                                )}
                                            </>
                                        ) : (
                                            /* Not logged in — show prompt */
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                                                <p className="text-sm font-bold text-slate-600">
                                                    Sign in to confirm or update this price
                                                </p>
                                                <div className="flex gap-2">
                                                    <Link href="/login" className="flex-1">
                                                        <button className="w-full py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-white transition-colors">
                                                            Log In
                                                        </button>
                                                    </Link>
                                                    <Link href="/register" className="flex-1">
                                                        <button className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-glow hover:bg-primary/90 transition-colors">
                                                            Sign Up
                                                        </button>
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-200/50 flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                                <span>Updated {formatRelativeTime(product.lastUpdated)}</span>
                                <span className="flex items-center gap-1 text-primary">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    ACTIVE
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Discussion Section */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Post a message */}
                    <section className="relative">
                        <Card className="glass !bg-white/40 border-white/60 p-8 relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shadow-inner">
                                        💬
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Product Discussion</h2>
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                            {replyingTo ? 'Replying to insight' : `${messages.length} ${messages.length === 1 ? 'message' : 'messages'} · Post anonymously`}
                                        </p>
                                    </div>
                                </div>

                                {replyingTo && (
                                    <div className="mb-6 bg-slate-50/80 border border-slate-200 p-4 rounded-xl relative group animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1 h-3 bg-primary rounded-full"></span>
                                                Replying to
                                            </span>
                                            <button
                                                onClick={() => setReplyingTo(null)}
                                                className="text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                        <p className="text-sm text-slate-600 font-medium italic truncate">"{replyingTo.content}"</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmitMessage} className="space-y-6">
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
                                            {posting ? 'PUBLISHING...' : replyingTo ? 'POST REPLY' : 'POST MESSAGE'}
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

                    {/* Messages list */}
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
                                                    <div className="space-y-2 flex-1">
                                                        {msg.replyToContent && (
                                                            <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg mb-2">
                                                                <span className="text-lg opacity-40">➥</span>
                                                                <p className="text-xs font-bold text-slate-400 italic">"{msg.replyToContent}"</p>
                                                            </div>
                                                        )}
                                                        <p className="text-slate-700 text-lg leading-relaxed font-medium whitespace-pre-wrap antialiased">
                                                            {msg.content}
                                                        </p>
                                                    </div>
                                                    {msg.isAdmin && (
                                                        <span className="flex-shrink-0 bg-primary/10 text-primary text-[9px] font-black px-2 py-1 rounded-md tracking-tighter uppercase border border-primary/20 animate-pulse">
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="pt-4 border-t border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between items-center">
                                                    <span>{formatRelativeTime(msg.createdAt)}</span>
                                                    <button
                                                        onClick={() => {
                                                            setReplyingTo(msg);
                                                            const section = document.querySelector('section');
                                                            if (section) section.scrollIntoView({ behavior: 'smooth' });
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg hover:bg-primary/5 hover:text-primary transition-all duration-300"
                                                    >
                                                        REPLY
                                                    </button>
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
