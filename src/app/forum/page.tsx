'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui-base';
import { Navbar } from '@/components/Navbar';
import { BackToTop } from '@/components/BackToTop';
import { formatTimestamp } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Edit2, Trash2, Lock, AlertCircle, MoreHorizontal, Reply, Flag, X } from 'lucide-react';

import { formatPriceRange } from '@/lib/price-utils';
import { getAnonymousIdentity } from '@/lib/identity';

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
    userId?: {
        _id: string;
        name: string;
    } | string;
    anonId?: string;
    createdAt: string;
}


export default function ForumPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const { user } = useAuth();
    const [currentAnonId, setCurrentAnonId] = useState<string | null>(null);
    const [editMessage, setEditMessage] = useState<Message | null>(null);
    const [editContent, setEditContent] = useState('');
    const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [systemConfig, setSystemConfig] = useState<{ forumLocked: boolean, forumLockedMessage: string } | null>(null);
    
    // City Scoping State
    const [cities, setCities] = useState<string[]>([]);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);

    const fetchCities = async () => {
        try {
            const res = await fetch('/api/cities');
            if (res.ok) {
                const data = await res.json();
                setCities(data);
                // No longer defaulting to first city - will remain null (All Cities)
            }
        } catch (e) {
            console.error('Failed to fetch cities');
        }
    };

    const fetchMessages = async () => {
        try {
            const url = selectedCity && selectedCity !== 'All' 
                ? `/api/messages?city=${selectedCity}` 
                : '/api/messages';
            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) {
                setMessages(data);
            } else {
                setMessages([]);
                console.error('API Error:', data.error || 'Unknown error');
            }
        } catch (error) {
            setMessages([]);
            console.error('Failed to fetch messages');
        } finally {
            setLoading(false);
        }
    };

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

    useEffect(() => {
        fetchCities();
        fetchConfig();

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
            setTimeout(() => setHighlightedMsgId(null), 3000); // Remove highlight after 3 seconds
        }
    }, []);

    // Re-fetch messages when city changes
    useEffect(() => {
        setLoading(true);
        fetchMessages();
    }, [selectedCity]);

    const handleSubmit = async (e: React.FormEvent) => {
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
                    parentId: replyingTo?._id,
                    city: selectedCity
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setContent('');
                setReplyingTo(null);
                fetchMessages();
            } else {
                setError(data.error || 'Failed to post message');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setPosting(false);
        }
    };

    const handleReport = (id: string) => {
        alert('Message reported to administrators.');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this message?')) return;
        try {
            const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchMessages();
            } else {
                alert('Failed to delete message');
            }
        } catch (e) {
            alert('An error occurred');
        }
    };

    const submitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editMessage || !editContent.trim()) return;

        try {
            const res = await fetch(`/api/messages/${editMessage._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editContent })
            });
            if (res.ok) {
                setEditMessage(null);
                setEditContent('');
                fetchMessages();
            } else {
                alert('Failed to edit message');
            }
        } catch (e) {
            alert('An error occurred');
        }
    };

    return (
        <div className="min-h-screen bg-mesh selection:bg-primary/20">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-8 sm:py-16 pb-40 md:pb-16 scroll-mt-24">
                {/* Unified City Forum Selector */}
                <div className="flex flex-col items-center mb-12 space-y-6 w-full">
                    <div className="w-full flex items-center justify-center pointer-events-none">
                        <div className="flex items-center gap-2 bg-white/40 p-2 rounded-2xl border border-white/60 overflow-x-auto no-scrollbar max-w-full pointer-events-auto">
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 border-r border-slate-200 whitespace-nowrap">
                                 Select Forum
                            </span>
                            <div className="flex items-center gap-2">
                            {['All Cities', ...cities].map((city) => (
                                <button
                                    key={city}
                                    onClick={() => setSelectedCity(city === 'All Cities' ? null : city)}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                                        (selectedCity === city || (city === 'All Cities' && !selectedCity))
                                        ? 'bg-primary text-white shadow-glow-sm scale-105'
                                        : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm'
                                    }`}
                                >
                                    {city}
                                </button>
                            ))}
                            </div>
                        </div>
                    </div>
                    {selectedCity && (
                        <div className="animate-in fade-in slide-in-from-top-1">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                <span className="w-8 h-px bg-primary/20"></span>
                                You are in the {selectedCity} Forum
                                <span className="w-8 h-px bg-primary/20"></span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Form Section */}
                <section className="relative mb-16 sm:mb-20">
                    <div className="absolute -top-24 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
                    
                    {systemConfig?.forumLocked && user?.role !== 'admin' ? (
                        <Card className="glass !bg-rose-50/40 border-rose-200/60 p-6 sm:p-10 relative overflow-hidden group">
                            <div className="absolute -right-8 -bottom-8 text-rose-500/5 group-hover:text-rose-500/10 transition-colors pointer-events-none">
                                <Lock size={180} />
                            </div>
                            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] bg-rose-100 text-rose-500 flex items-center justify-center shadow-premium border border-rose-200 animate-bounce-subtle">
                                    <Lock size={32} className="sm:size-[40px]" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">Discussions <span className="text-rose-500 italic">Restricted</span></h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Maintenance Protocol Active</p>
                                </div>
                                <div className="bg-white/60 backdrop-blur-md border border-rose-100 p-6 rounded-3xl max-w-lg shadow-sm">
                                    <p className="text-slate-600 font-bold leading-relaxed italic text-sm sm:text-base">
                                        "{systemConfig.forumLockedMessage}"
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card className="glass !bg-white/40 border-white/60 p-5 sm:p-8 relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-xl sm:text-2xl shadow-premium-sm">
                                        🎭
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight">Post Anonymously</h2>
                                        <p className="text-[9px] sm:text-sm font-bold text-slate-400 uppercase tracking-widest">{replyingTo ? 'Replying to conversation' : 'Share insights with the community'}</p>
                                    </div>
                                </div>

                                {replyingTo && (
                                    <div className="mb-6 bg-slate-900 text-white p-4 rounded-2xl relative group animate-in fade-in slide-in-from-top-2 shadow-glow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1 h-3 bg-primary rounded-full"></span>
                                                Replying to
                                            </span>
                                            <button
                                                onClick={() => setReplyingTo(null)}
                                                className="text-[10px] font-black text-white/50 hover:text-white transition-colors uppercase tracking-widest"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                        <p className="text-sm text-white/90 font-medium italic truncate">"{replyingTo.content}"</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="relative">
                                        <textarea
                                            className="w-full p-4 sm:p-6 bg-white/60 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 min-h-[140px] sm:min-h-[160px] resize-none text-slate-700 text-base sm:text-lg placeholder:text-slate-300 shadow-inner"
                                            placeholder="What's the latest deal? (Max 300 characters)"
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            maxLength={300}
                                            required
                                        />
                                        <div className="absolute bottom-4 right-6 flex items-center gap-2">
                                            <div className={`h-1.5 w-1.5 rounded-full ${content.length > 250 ? 'bg-orange-500 animate-pulse' : 'bg-slate-200'}`} />
                                            <span className="text-[10px] font-black text-slate-400 tracking-tighter uppercase whitespace-nowrap">
                                                {content.length} / 300
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="submit" className="w-full sm:w-auto px-10 py-3.5 sm:py-4 shadow-glow font-black tracking-widest text-xs uppercase" disabled={posting}>
                                            {posting ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Publishing...
                                                </span>
                                            ) : replyingTo ? 'Post Reply' : 'Share Message'}
                                        </Button>
                                    </div>
                                    {error && (
                                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 animate-shake">
                                            <span className="text-xl">⚠️</span>
                                            <p className="text-rose-600 text-sm font-bold antialiased">{error}</p>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </Card>
                    )}
                </section>

                {/* Discussions Section */}
                <section className="space-y-6 sm:space-y-8">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                {selectedCity ? `${selectedCity} Forum` : 'Real-time'} <span className="text-primary italic">Feed</span>
                                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                {selectedCity ? `Localized chatter for ${selectedCity}` : 'Live global community insights'}
                            </p>
                        </div>
                        <div className="bg-white border border-slate-100 px-4 py-1.5 rounded-full shadow-premium-sm flex items-center gap-2">
                            <span className="text-xs font-black text-primary">{messages.length}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Messages</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-40 glass rounded-[2rem] relative overflow-hidden">
                                    <div className="absolute inset-0 animate-shimmer" />
                                </div>
                            ))}
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-24 glass rounded-[2.5rem] border-2 border-dashed border-slate-200">
                            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl opacity-50">💬</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-700 mb-2">The floor is yours</h3>
                            <p className="text-slate-400 font-medium">Be the first to spark a conversation!</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {messages.map((msg) => {
                                const msgUserId = typeof msg.userId === 'object' ? msg.userId?._id : msg.userId;
                                const isOwner = (user && (msgUserId === user.id || msgUserId === (user as any)._id)) || 
                                              (!user && currentAnonId && msg.anonId === currentAnonId) || 
                                              (user?.role === 'admin');
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
                                    className={`relative overflow-hidden border-none shadow-premium transition-all duration-500 hover:shadow-premium-lg group ${isHighlighted ? 'ring-4 ring-primary bg-primary/5' : ''}`}
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
                                        if (startX - endX > 70 && (!systemConfig?.forumLocked || user?.role === 'admin')) {
                                            setReplyingTo(msg);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                >
                                    {/* Sidebar accent for anon users */}
                                    {isAnon && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: identity.color }} />
                                    )}

                                    <div className="flex gap-4 p-5 sm:p-7 items-start relative">
                                        {/* Swipe Indicator (Mobile Only) */}
                                        <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none md:hidden">
                                            <Reply size={20} className="text-primary" />
                                            <span className="text-[8px] font-black text-primary uppercase">Reply</span>
                                        </div>

                                        {/* Avatar */}
                                        <div 
                                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-sm sm:text-base font-black shadow-premium-sm transition-transform group-hover:scale-105"
                                            style={isAnon ? { background: identity.gradient, color: '#ffffff' } : { backgroundColor: '#f8fafc', color: '#1e293b' }}
                                        >
                                            {isAnon ? identity.avatarLabel : authorName.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Content column */}
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            {/* Header: name + ⋯ menu */}
                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-[15px] font-black tracking-tight text-slate-800 truncate">{authorName}</span>
                                                    {msg.isAdmin && (
                                                        <span className="flex-shrink-0 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md tracking-widest uppercase">
                                                            MODERATOR
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="relative flex-shrink-0">
                                                    <button
                                                        onClick={() => setActiveMenuId(activeMenuId === msg._id ? null : msg._id)}
                                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                                                    >
                                                        {activeMenuId === msg._id ? <X size={18} /> : <MoreHorizontal size={18} />}
                                                    </button>
                                                    {activeMenuId === msg._id && (
                                                        <div className="absolute right-0 top-11 z-50 bg-white rounded-2xl shadow-premium-lg border border-slate-100 p-2 min-w-[160px] animate-in fade-in zoom-in-95 duration-200">
                                                            {isOwner && (!systemConfig?.forumLocked || user?.role === 'admin') && (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditMessage(msg);
                                                                            setEditContent(msg.content);
                                                                            setActiveMenuId(null);
                                                                        }}
                                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
                                                                    >
                                                                        <Edit2 size={16} /> Edit Message
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { handleDelete(msg._id); setActiveMenuId(null); }}
                                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                                                    >
                                                                        <Trash2 size={16} /> Delete Message
                                                                    </button>
                                                                    <div className="my-1.5 h-px bg-slate-100 mx-2" />
                                                                </>
                                                            )}
                                                            <button
                                                                onClick={() => { handleReport(msg._id); setActiveMenuId(null); }}
                                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
                                                            >
                                                                <Flag size={16} /> Report Content
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Product tag */}
                                            {msg.productId && (
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="flex items-center gap-1.5 bg-primary/5 text-primary border border-primary/10 px-2.5 py-1 rounded-lg">
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{msg.productId.name}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {formatPriceRange(msg.productId.price, msg.productId.maxPrice)}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Clickable reply quote → scrolls to original */}
                                            {msg.replyToContent && (
                                                <button
                                                    onClick={() => {
                                                        const pId = (msg as any).parentId;
                                                        if (pId) {
                                                            const el = document.getElementById(`msg-${pId}`);
                                                            if (el) {
                                                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                el.classList.add('ring-4', 'ring-primary');
                                                                setTimeout(() => el.classList.remove('ring-4', 'ring-primary'), 1500);
                                                            }
                                                        }
                                                    }}
                                                    className="flex items-center gap-3 w-full bg-slate-50 hover:bg-slate-100 border border-slate-100 px-4 py-2.5 rounded-2xl mb-3 text-left transition-all group/quote"
                                                >
                                                    <span className="text-primary font-black text-lg group-hover/quote:scale-110 transition-transform">➥</span>
                                                    <p className="text-xs font-bold text-slate-500 truncate antialiased">
                                                        Replying to: <span className="italic font-medium text-slate-400">"{msg.replyToContent}"</span>
                                                    </p>
                                                </button>
                                            )}

                                            {/* Message body */}
                                            <p className="text-slate-900 text-sm sm:text-[16px] leading-relaxed font-bold whitespace-pre-wrap break-words antialiased mb-4">
                                                {msg.content}
                                            </p>

                                            {/* Footer: Reply button (left) + timestamp (right) */}
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                {(!systemConfig?.forumLocked || user?.role === 'admin') ? (
                                                    <button
                                                        onClick={() => {
                                                            setReplyingTo(msg);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black hover:bg-primary hover:shadow-glow transition-all uppercase tracking-[0.1em]"
                                                    >
                                                        <Reply size={14} className="group-hover:rotate-12 transition-transform" />
                                                        Post Reply
                                                    </button>
                                                ) : <span />}
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                                                    {formatTimestamp(msg.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                        </div>
                    )}
                </section>
            </main>

            {/* Edit Modal */}
            {editMessage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-lg p-6 bg-white shadow-2xl relative animate-in zoom-in-95">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2 mb-4">
                            <Edit2 size={20} className="text-primary" /> Edit Message
                        </h3>
                        <form onSubmit={submitEdit} className="space-y-4">
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
                                <Button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-glow-sm">
                                    Save Changes
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
