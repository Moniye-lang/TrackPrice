'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button, Card } from '@/components/ui-base';
import { Navbar } from '@/components/Navbar';
import { BackToTop } from '@/components/BackToTop';
import { PriceProposalWidget } from '@/components/PriceProposalWidget';
import { formatRelativeTime, formatTimestamp } from '@/lib/utils';
import Link from 'next/link';
import { use } from 'react';
import { formatPriceRange } from '@/lib/price-utils';
import { MapPin, Users, MessageCircle, Check, X, Send, History, TrendingDown, TrendingUp, Sparkles, Clock, ArrowLeft, ExternalLink, AlertTriangle, ChevronRight, CornerDownRight, Pencil, Trash2, Lock, AlertCircle, MoreHorizontal, Reply, Flag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProduct } from '@/hooks/useHomeData';
import { getAnonymousIdentity } from '@/lib/identity';

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
    reportCount: number;
    lastUpdated: string;
    isFeatured?: boolean;
    lastUpdatedBy?: string;
    flagged?: boolean;
    priceStatus?: 'up' | 'down' | 'stable';
    suggestions?: Array<{
        _id: string;
        price: number;
        maxPrice?: number;
        userName: string;
        vouchCount: number;
        createdAt: string;
    }>;
}

interface Message {
    _id: string;
    content: string;
    userId?: {
        _id: string;
        name: string;
    } | string;
    anonId?: string;
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
    const { user: authUser, isLoading: authLoading } = useAuth();
    const { data, isLoading: loading, error: fetchError, refetch } = useProduct(id);
    
    const product = data?.product || null;
    const messages = data?.messages || [];
    
    const [imgError, setImgError] = useState(false);
    const [content, setContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    // Guest auth & highlight
    const [currentAnonId, setCurrentAnonId] = useState<string | null>(null);
    const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

    // Edit / delete state
    const [editMessage, setEditMessage] = useState<Message | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editSaving, setEditSaving] = useState(false);
    const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
    const [systemConfig, setSystemConfig] = useState<{ forumLocked: boolean, forumLockedMessage: string } | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const handleDeleteMessage = async (msgId: string) => {
        setDeletingMessageId(msgId);
        try {
            const res = await fetch(`/api/messages/${msgId}`, { method: 'DELETE' });
            if (res.ok) {
                refetch();
            }
        } finally {
            setDeletingMessageId(null);
        }
    };

    const handleEditMessage = async (msgId: string) => {
        if (!editContent.trim()) return;
        setEditSaving(true);
        try {
            const res = await fetch(`/api/messages/${msgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editContent }),
            });
            if (res.ok) {
                setEditMessage(null);
                setEditContent('');
                refetch();
            }
        } finally {
            setEditSaving(false);
        }
    };

    // Verify existing price
    const [verifying, setVerifying] = useState(false);
    const [verifyMsg, setVerifyMsg] = useState('');

    // Update price (propose a new price)
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [newPrice, setNewPrice] = useState('');
    const [updatingPrice, setUpdatingPrice] = useState(false);
    const [updateMsg, setUpdateMsg] = useState('');

    // Feedback
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    useEffect(() => {
        if (product) {
            document.title = `${product.name} - ₦${product.price.toLocaleString()} | TrackPricely`;
        } else {
            document.title = 'Product Details | TrackPricely';
        }

        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return null;
        };
        setCurrentAnonId(getCookie('anon_id') || null);

        // Check for hash highlight
        if (window.location.hash.startsWith('#msg-')) {
            const msgId = window.location.hash.replace('#msg-', '');
            setHighlightedMsgId(msgId);
            setTimeout(() => setHighlightedMsgId(null), 3000);
        }

        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/config');
                if (res.ok) {
                    const data = await res.json();
                    setSystemConfig(data);
                }
            } catch (error) {
                console.error('Failed to fetch config');
            }
        };
        fetchConfig();
    }, [product]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const confirmId = params.get('confirm');
        const shouldUpdate = params.get('update') === 'true';

        if (confirmId && product) {
            handleConfirmPrice(confirmId);
            window.history.replaceState({}, '', window.location.pathname);
        }

        if (shouldUpdate && product) {
            setShowUpdateForm(true);
            // Scroll to form after a small delay to ensure it's rendered
            setTimeout(() => {
                document.getElementById('price-action-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [product]);

    const handleConfirmPrice = async (updateId: string) => {
        if (!updateId) {
            console.error('handleConfirmPrice called without updateId');
            return;
        }
        try {
            const res = await fetch(`/api/products/${id}/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updateId })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                refetch(); // Refresh product data
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
                refetch();
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
                    price: newPrice
                }),
            });
            const data = await res.json();

            if (res.ok) {
                setUpdateMsg('✓ Price update submitted!');
                setFeedbackMessage(`Legendary! Your update will help countless people find the best prices. ✨`);
                setTimeout(() => setFeedbackMessage(null), 6000);
                setNewPrice('');
                setShowUpdateForm(false);
                refetch();
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
                refetch();
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

    const jsonLd = product ? {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "image": product.imageUrl,
        "description": `Check the latest price for ${product.name} in Ibadan.`,
        "brand": {
            "@type": "Brand",
            "name": product.brand || "Generic"
        },
        "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "NGN",
            "availability": "https://schema.org/InStock"
        }
    } : null;

    return (
        <div className="min-h-screen bg-mesh selection:bg-primary/20">
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12 pb-32">
                {/* Product Info Section */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Price Proposal Widget (Top Right of Detail) */}
                    <PriceProposalWidget 
                        productId={id} 
                        proposals={product.suggestions || []} 
                        onVouchSuccess={refetch} 
                    />

                    <Card className="sticky top-24 p-0 overflow-hidden border-none shadow-premium bg-white/40 glass">
                        <div className="relative h-72 w-full overflow-hidden bg-slate-50">
                            {product.imageUrl && product.imageUrl.length > 5 && !imgError ? (
                                <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    fill
                                    priority
                                    onError={() => setImgError(true)}
                                    className="object-cover transition-transform duration-700 hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100/50">
                                    <div className="w-20 h-20 rounded-full bg-white shadow-premium flex items-center justify-center">
                                        <span className="text-4xl" aria-hidden="true">📦</span>
                                    </div>
                                    <p className="mt-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{product.category}</p>
                                </div>
                            )}
                            <div className="absolute top-4 right-4 glass px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest text-primary uppercase shadow-sm border border-white/20 flex items-center gap-1.5">
                                <Sparkles size={10} className="text-accent" />
                                {product.category}
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                                    <Sparkles size={12} className="text-accent" />
                                    {product.category} {product.brand && `• ${product.brand}`}
                                </p>
                                <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-[1.1] mb-3">{product.name}</h1>
                                {(product.variant || product.size) && (
                                    <p className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                                        {product.variant} {product.size && ` | ${product.size}`}
                                    </p>
                                )}
                                <div className="flex flex-wrap items-center gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-5xl font-black tracking-tighter ${
                                            product.priceStatus === 'down' ? 'text-rose-600' : 
                                            product.priceStatus === 'up' ? 'text-emerald-600' : 
                                            'text-slate-900'
                                        }`}>
                                            {formatPriceRange(product.price, product.maxPrice)}
                                        </span>
                                        {product.priceStatus === 'down' && <TrendingDown size={32} className="text-rose-600 animate-bounce-subtle" />}
                                        {product.priceStatus === 'up' && <TrendingUp size={32} className="text-emerald-600 animate-bounce-subtle" />}
                                    </div>
                                    <div className="flex gap-2">
                                        {product.flagged && (
                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100 uppercase tracking-widest">
                                                <AlertTriangle size={12} />
                                                Flagged
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {(product.storeId || product.storeLocation) && (
                                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 mb-6">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <MapPin size={12} aria-hidden="true" />
                                            Store Location
                                        </p>
                                        <p className="text-sm font-black text-slate-800">
                                            {product.storeId ? `${product.storeId.name} • ${product.storeId.area}, ${product.storeId.city}` : product.storeLocation}
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">
                                    <div className="flex items-center gap-2">
                                        <Users size={14} aria-hidden="true" />
                                        {(product.reportCount || 0) > 0
                                            ? <><span className="text-slate-800">{product.reportCount}</span> Confirmations</>
                                            : <span className="text-primary/60">Be the first to confirm</span>
                                        }
                                    </div>
                                </div>

                                {/* Price Action Buttons — Auth aware */}
                                {!authLoading && (
                                    <div className="space-y-4">
                                        <div id="price-action-section" className="bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 relative overflow-hidden group/section">
                                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover/section:bg-primary/20 transition-all duration-1000" />
                                            <h3 className="relative z-10 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-center">Is this price still correct?</h3>
                                            {!showUpdateForm ? (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <Button
                                                            onClick={handleVerifyPrice}
                                                            disabled={verifying}
                                                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-glow-sm"
                                                        >
                                                            {verifying ? '...' : 'YES — Confirm'}
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                if (!authUser) {
                                                                    setUpdateMsg('🔒 Sign in to suggest a new price.');
                                                                    return;
                                                                }
                                                                setShowUpdateForm(true);
                                                            }}
                                                            className="bg-slate-800 hover:bg-slate-700 text-slate-400 font-black py-4 rounded-2xl border border-slate-700"
                                                        >
                                                            NO — Update
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
                                                                className="w-full bg-primary/20 hover:bg-primary text-primary hover:text-white font-black py-3 rounded-2xl border border-primary/20 transition-all text-xs mb-3"
                                                            >
                                                                JOIN CONSENSUS
                                                            </Button>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Confirm Prices page link */}
                                                    <Button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            window.location.href = `/product/${product._id}/price-change`;
                                                        }}
                                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl border border-slate-700 flex items-center justify-center gap-2"
                                                    >
                                                        <Users size={16} />
                                                        CONFIRM PRICES
                                                    </Button>
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
                                                    <div className="flex gap-2 mt-4">
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
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={12} />
                                        Updated {formatRelativeTime(product.lastUpdated)}
                                    </span>
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
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                <Users size={14} />
                                Community Suggestions
                            </h3>
                            <div className="space-y-3">
                                {product.suggestions.map((suggestion: { _id: string, price: number, userName: string, createdAt: string }, idx: number) => (
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
                        {systemConfig?.forumLocked && authUser?.role !== 'admin' ? (
                            <Card className="glass !bg-rose-50/40 border-rose-200/60 p-10 relative overflow-hidden group">
                                <div className="absolute -right-8 -bottom-8 text-rose-500/5 group-hover:text-rose-500/10 transition-colors pointer-events-none">
                                    <Lock size={180} />
                                </div>
                                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-rose-100 text-rose-500 flex items-center justify-center shadow-premium border border-rose-200 animate-bounce-subtle">
                                        <Lock size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Support <span className="text-rose-500 italic">Paused</span></h2>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Maintenance Protocol Active</p>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-md border border-rose-100 p-6 rounded-3xl max-w-lg shadow-sm">
                                        <p className="text-slate-600 font-bold leading-relaxed italic">
                                            "{systemConfig.forumLockedMessage}"
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-rose-400 uppercase tracking-widest">
                                        <AlertCircle size={14} />
                                        <span>Contribution access is temporarily restricted</span>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <Card className="glass !bg-white/40 border-white/60 p-8 relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                            <MessageCircle size={24} />
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
                        )}
                    </section>

                    {/* Messages list */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Recent Insights</h3>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{messages.length} Insights</span>
                        </div>

                        {messages.length === 0 ? (
                            <div className="text-center py-24 glass rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center">
                                <MessageCircle size={48} className="text-slate-200 mb-4" />
                                <h3 className="text-xl font-black text-slate-400">No discussions yet.</h3>
                                <p className="text-slate-300 font-bold uppercase text-[10px] tracking-widest mt-2 px-6">Be the first to analyze this product price accuracy</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {messages.map((msg) => {
                                    const msgUserId = typeof msg.userId === 'object' ? msg.userId?._id : msg.userId;
                                    const canModify = (authUser && (msgUserId === authUser.id || msgUserId === (authUser as any)._id)) || 
                                                      (!authUser && currentAnonId && msg.anonId === currentAnonId) || 
                                                      (authUser?.role === 'admin');
                                    const isHighlighted = highlightedMsgId === msg._id;
                                    
                                    const isAnon = !msg.userId && !!msg.anonId;
                                    const identity = getAnonymousIdentity(msg.anonId);
                                    const authorName = (msg.userId && typeof msg.userId === 'object' && msg.userId.name) 
                                        ? msg.userId.name 
                                        : (isAnon ? identity.shortId : 'User');

                                    return (
                                        <Card 
                                            key={msg._id} 
                                            id={`msg-${msg._id}`}
                                            className={`relative group p-4 sm:p-6 hover:shadow-glow transition-all duration-500 bg-white/60 border-l-4 overflow-visible ${isHighlighted ? 'ring-4 ring-primary bg-primary/5 animate-pulse' : ''}`}
                                            style={{ borderLeftColor: isAnon ? identity.color : 'transparent' }}
                                            onTouchStart={(e) => {
                                                (e.currentTarget as any)._touchStartX = e.touches[0].clientX;
                                            }}
                                            onTouchMove={(e) => {
                                                const moveX = e.touches[0].clientX;
                                                const startX = (e.currentTarget as any)._touchStartX;
                                                const diff = startX - moveX;
                                                if (diff > 0 && diff < 80) {
                                                    e.currentTarget.style.transform = `translateX(-${diff}px)`;
                                                }
                                            }}
                                            onTouchEnd={(e) => {
                                                const startX = (e.currentTarget as any)._touchStartX;
                                                const endX = e.changedTouches[0].clientX;
                                                e.currentTarget.style.transform = '';
                                                if (startX - endX > 70 && (!systemConfig?.forumLocked || authUser?.role === 'admin')) {
                                                    setReplyingTo(msg);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }
                                            }}
                                        >
                                            {/* Swipe Indicator (Mobile Only) */}
                                            <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none md:hidden">
                                                <Reply size={20} className="text-primary" />
                                                <span className="text-[8px] font-black text-primary uppercase">Reply</span>
                                            </div>
                                            <div className="flex gap-3 sm:gap-4 items-start">
                                                {/* Avatar */}
                                                <div 
                                                    className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-sm font-black shadow-inner"
                                                    style={isAnon ? { background: identity.gradient, color: '#ffffff' } : { backgroundColor: '#f1f5f9', color: '#94a3b8' }}
                                                >
                                                    {isAnon ? identity.avatarLabel : authorName.charAt(0).toUpperCase()}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    {/* Header row */}
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="text-sm font-black tracking-tight text-slate-800 truncate">{authorName}</span>
                                                            {msg.isAdmin && (
                                                                <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-md tracking-tighter uppercase border border-primary/20 flex-shrink-0">
                                                                    Admin
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Three-dot action menu */}
                                                        <div className="relative flex-shrink-0">
                                                            <button
                                                                onClick={() => setActiveMenuId(activeMenuId === msg._id ? null : msg._id)}
                                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all"
                                                            >
                                                                {activeMenuId === msg._id ? <X size={14} /> : <MoreHorizontal size={14} />}
                                                            </button>
                                                            {activeMenuId === msg._id && (
                                                                <div className="absolute right-0 top-8 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-1.5 min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
                                                                    {(!systemConfig?.forumLocked || authUser?.role === 'admin') && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setReplyingTo(msg);
                                                                                setActiveMenuId(null);
                                                                                const section = document.querySelector('section');
                                                                                if (section) section.scrollIntoView({ behavior: 'smooth' });
                                                                            }}
                                                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-primary/5 hover:text-primary transition-all"
                                                                        >
                                                                            <Reply size={14} /> Reply
                                                                        </button>
                                                                    )}
                                                                    {canModify && (!systemConfig?.forumLocked || authUser?.role === 'admin') && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => { setEditMessage(msg); setEditContent(msg.content); setActiveMenuId(null); }}
                                                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all"
                                                                            >
                                                                                <Pencil size={14} /> Edit
                                                                            </button>
                                                                            <button
                                                                                onClick={() => { handleDeleteMessage(msg._id); setActiveMenuId(null); }}
                                                                                disabled={deletingMessageId === msg._id}
                                                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-500 transition-all disabled:opacity-50"
                                                                            >
                                                                                <Trash2 size={14} /> Delete
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                    <div className="my-1 h-px bg-slate-100" />
                                                                    <button
                                                                        onClick={() => setActiveMenuId(null)}
                                                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-400 transition-all"
                                                                    >
                                                                        <Flag size={14} /> Report
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Verified-at tag */}
                                                    {msg.productId && (
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                                                                <Check size={10} className="text-emerald-500" />
                                                                Verified at: {formatPriceRange(msg.productId.price, msg.productId.maxPrice)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Reply quote */}
                                                    {msg.replyToContent && (
                                                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl mb-2 max-w-full">
                                                            <CornerDownRight size={14} className="text-primary/40 flex-shrink-0" />
                                                            <p className="text-xs font-bold text-slate-400 italic truncate">"{msg.replyToContent}"</p>
                                                        </div>
                                                    )}

                                                    {/* Message body + inline timestamp */}
                                                    <p className="text-slate-700 text-base leading-relaxed font-medium whitespace-pre-wrap antialiased break-words">
                                                        {msg.content}
                                                        <span className="inline-block ml-2 align-bottom text-[11px] font-black text-slate-700 whitespace-nowrap">
                                                            {formatTimestamp(msg.createdAt)}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Edit Modal */}
            {editMessage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-lg p-6 bg-white shadow-2xl relative animate-in zoom-in-95">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2 mb-4">
                            <Pencil size={20} className="text-primary" /> Edit Message
                        </h3>
                        <form onSubmit={(e) => { e.preventDefault(); handleEditMessage(editMessage._id); }} className="space-y-4">
                            <textarea
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700 resize-none h-32"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                maxLength={300}
                                required
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditMessage(null)}
                                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <Button type="submit" disabled={editSaving} className="px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-glow-sm">
                                    {editSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
            <BackToTop />
        </div>
    );
}
