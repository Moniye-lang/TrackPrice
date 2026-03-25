'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui-base';
import { Navbar } from '@/components/Navbar';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import { use } from 'react';
import { formatPriceRange } from '@/lib/price-utils';

interface Product {
    _id: string;
    name: string;
    brand?: string;
    variant?: string;
    size?: string;
    price: number;
    maxPrice?: number;
    category: string;
    storeId?: {
        _id: string;
        name: string;
        area: string;
        city: string;
    };
    storeLocation?: string;
    imageUrl: string;
    confidenceLevel: string;
    reportCount: number;
    lastUpdated: string;
    isFeatured?: boolean;
    lastUpdatedBy?: string;
    flagged?: boolean;
    suggestions?: Array<{
        price: number;
        userName: string;
        createdAt: string;
    }>;
}

interface Message {
    _id: string;
    content: string;
    isAdmin?: boolean;
    productId?: {
        _id: string;
        name: string;
        price: number;
        maxPrice?: number;
    };
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
    const [suggestionLocation, setSuggestionLocation] = useState('');
    const [updatingPrice, setUpdatingPrice] = useState(false);
    const [updateMsg, setUpdateMsg] = useState('');

    // Feedback
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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

    useEffect(() => {
        if (product) {
            document.title = `${product.name} - ₦${product.price.toLocaleString()} | TrackPrice`;
        } else {
            document.title = 'Product Details | TrackPrice';
        }
    }, [product]);

    useEffect(() => {
        const confirmId = new URLSearchParams(window.location.search).get('confirm');
        if (confirmId && product) {
            handleConfirmPrice(confirmId);
            // Clear param
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [product]);

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
                fetchData(); // Refresh product data
            } else {
                alert(data.error || 'Failed to confirm price');
            }
        } catch (error) {
            console.error('Confirm failed', error);
        }
    };

    const handleVerifyPrice = async () => {
        if (!product) return;
        setVerifying(true);
        setVerifyMsg('');
        setFeedbackMessage(null);

        try {
            const res = await fetch(`/api/products/${product._id}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: product.price }),
            });
            const data = await res.json();

            if (res.ok) {
                setVerifyMsg('✓ Thank you! Price confirmed.');
                setFeedbackMessage(`Awesome! Your confirmation helps maintain accuracy for ${Math.floor(Math.random() * 50) + 10} shoppers! 🚀`);
                setTimeout(() => setFeedbackMessage(null), 6000);
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

    const handleUpdatePrice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product || !newPrice) return;
        setUpdatingPrice(true);
        setUpdateMsg('');
        setFeedbackMessage(null);

        try {
            const res = await fetch(`/api/products/${product._id}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    price: newPrice,
                    storeLocation: suggestionLocation
                }),
            });
            const data = await res.json();

            if (res.ok) {
                setUpdateMsg('✓ Price update submitted!');
                setFeedbackMessage(`Legendary! Your update will help countless people find the best prices. ✨`);
                setTimeout(() => setFeedbackMessage(null), 6000);
                setNewPrice('');
                setSuggestionLocation('');
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
                                <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">
                                    {product.category} {product.brand && `• ${product.brand}`}
                                </p>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight mb-2">{product.name}</h1>
                                {(product.variant || product.size) && (
                                    <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">
                                        {product.variant} {product.size && `| ${product.size}`}
                                    </p>
                                )}
                                <div className="flex flex-wrap items-baseline gap-3 mb-3">
                                    <span className="text-5xl font-black text-slate-900 tracking-tighter">
                                        {formatPriceRange(product.price, product.maxPrice)}
                                    </span>
                                    {product.flagged ? (
                                        <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md border border-rose-200">FLAGGED</span>
                                    ) : product.confidenceLevel === 'High' ? (
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">VERIFIED</span>
                                    ) : (
                                        <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">ESTIMATE</span>
                                    )}
                                </div>

                                {(product.storeId || product.storeLocation) && (
                                    <p className="text-sm font-bold text-[#000000] flex items-center gap-2 mb-5">
                                        <span className="text-lg">📍</span>
                                        {product.storeId ? `${product.storeId.name} (${product.storeId.area}, ${product.storeId.city})` : product.storeLocation}
                                    </p>
                                )}

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
                                    <div className="space-y-4">
                                        {authUser ? (
                                            <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800">
                                                <h3 className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-center">Is this price still correct?</h3>
                                                {!showUpdateForm ? (
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <Button
                                                                onClick={handleVerifyPrice}
                                                                disabled={verifying}
                                                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-glow-sm"
                                                            >
                                                                {verifying ? '...' : 'YES'}
                                                            </Button>
                                                            <Button
                                                                onClick={() => setShowUpdateForm(true)}
                                                                className="bg-slate-800 hover:bg-slate-700 text-slate-400 font-black py-4 rounded-2xl border border-slate-700"
                                                            >
                                                                NO
                                                            </Button>
                                                        </div>

                                                        {/* Intelligent "Join Consensus" option */}
                                                        {product.suggestions && product.suggestions.length > 0 && (
                                                            <div className="pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-2">
                                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-3">
                                                                    Community suggests <span className="text-primary">{formatPriceRange(product.suggestions[0].price)}</span>
                                                                </p>
                                                                <Button
                                                                    onClick={() => handleConfirmPrice(product.suggestions![0]._id)}
                                                                    className="w-full bg-primary/20 hover:bg-primary text-primary hover:text-white font-black py-3 rounded-2xl border border-primary/20 transition-all text-xs"
                                                                >
                                                                    JOIN CONSENSUS
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <form onSubmit={handleUpdatePrice} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">₦</span>
                                                            <input
                                                                type="text"
                                                                placeholder="Enter new price"
                                                                value={newPrice}
                                                                onChange={(e) => setNewPrice(e.target.value)}
                                                                className="w-full pl-10 pr-4 py-4 rounded-2xl bg-slate-800 border-none text-white font-black text-xl placeholder:text-slate-600 focus:ring-2 focus:ring-primary outline-none transition"
                                                                required
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Store Location (e.g. Aisle 4)"
                                                            value={suggestionLocation}
                                                            onChange={(e) => setSuggestionLocation(e.target.value)}
                                                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border-none text-slate-300 font-bold text-xs placeholder:text-slate-600 outline-none"
                                                            required
                                                        />
                                                        <div className="flex gap-2">
                                                            <Button type="button" variant="secondary" className="flex-1 text-[10px] py-3 font-black bg-slate-800 text-slate-400 hover:text-white border-none" onClick={() => setShowUpdateForm(false)}>
                                                                CANCEL
                                                            </Button>
                                                            <Button type="submit" className="flex-1 text-[10px] py-3 font-black shadow-glow uppercase" disabled={updatingPrice}>
                                                                {updatingPrice ? '...' : 'SUBMIT NOW'}
                                                            </Button>
                                                        </div>
                                                    </form>
                                                )}
                                                {(verifyMsg || updateMsg) && (
                                                    <p className={`text-[10px] font-black p-3 rounded-xl mt-4 text-center uppercase tracking-widest ${(verifyMsg.startsWith('✓') || updateMsg.startsWith('✓'))
                                                        ? 'text-emerald-500 bg-emerald-500/10'
                                                        : 'text-rose-500 bg-rose-500/10'
                                                        }`}>
                                                        {verifyMsg || updateMsg}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            /* Not logged in — show prompt */
                                            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-loose">
                                                    Join the community to confirm or update real-time prices
                                                </p>
                                                <div className="flex gap-3">
                                                    <Link href="/login" className="flex-1">
                                                        <button className="w-full py-3 rounded-2xl border border-slate-800 text-[10px] font-black text-slate-400 hover:bg-slate-800 hover:text-white transition-all uppercase tracking-widest">
                                                            Log In
                                                        </button>
                                                    </Link>
                                                    <Link href="/register" className="flex-1">
                                                        <button className="w-full py-3 rounded-2xl bg-primary text-white text-[10px] font-black shadow-glow hover:bg-primary/90 transition-all uppercase tracking-widest">
                                                            Join
                                                        </button>
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {feedbackMessage && (
                                    <div className="animate-bounce-subtle bg-emerald-500 text-white px-4 py-3 rounded-xl font-bold text-xs shadow-premium flex items-center gap-2 border border-emerald-400 mt-4">
                                        <span>✨</span> {feedbackMessage}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-200/50 flex flex-col gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest p-6">
                                <div className="flex items-center justify-between">
                                    <span>Updated {formatRelativeTime(product.lastUpdated)}</span>
                                    <span className="flex items-center gap-1 text-slate-400">
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        In Queue
                                    </span>
                                </div>
                                {product.lastUpdatedBy && (
                                    <span className="text-slate-300">By {product.lastUpdatedBy}</span>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Community Suggestions Section */}
                    {product.suggestions && product.suggestions.length > 0 && (
                        <div className="mt-8 space-y-4">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Community Suggestions</h3>
                            <div className="space-y-3">
                                {product.suggestions.map((suggestion, idx) => (
                                    <div key={idx} className="glass bg-white/40 p-4 rounded-2xl border-none shadow-premium flex justify-between items-center group/item hover:bg-white/60 transition-all">
                                        <div>
                                            <p className="text-xl font-black text-slate-800 tracking-tighter">{formatPriceRange(suggestion.price)}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Proposed by {suggestion.userName}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleConfirmPrice(suggestion._id)}
                                                className="bg-primary/10 text-primary hover:bg-primary hover:text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-sm hover:shadow-premium hover:scale-105 transition-all border border-primary/20"
                                            >
                                                Confirm
                                            </button>
                                            <div className="text-[10px] font-black text-primary/40 group-hover/item:text-primary transition-colors">
                                                {formatRelativeTime(suggestion.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                                                        {msg.productId && (
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-[10px] font-bold text-slate-400">
                                                                    Verified at: {formatPriceRange(msg.productId.price, msg.productId.maxPrice)}
                                                                </span>
                                                            </div>
                                                        )}
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
