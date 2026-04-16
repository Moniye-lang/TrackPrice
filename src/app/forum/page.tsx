'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui-base';
import { Navbar } from '@/components/Navbar';
import { formatRelativeTime } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Edit2, Trash2 } from 'lucide-react';

import { formatPriceRange } from '@/lib/price-utils';

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
    userId?: string;
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

    const fetchMessages = async () => {
        try {
            const res = await fetch('/api/messages');
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

    useEffect(() => {
        fetchMessages();

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
                    parentId: replyingTo?._id
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

            <main className="max-w-4xl mx-auto px-4 py-16 scroll-mt-24">
                {/* Form Section */}
                <section className="relative mb-20">
                    <div className="absolute -top-24 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
                    <Card className="glass !bg-white/40 border-white/60 p-8 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shadow-inner">
                                    🎭
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Post Anonymously</h2>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{replyingTo ? 'Replying to conversation' : 'Share insights with the community'}</p>
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

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="relative">
                                    <textarea
                                        className="w-full p-6 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 min-h-[160px] resize-none text-slate-700 text-lg placeholder:text-slate-300 shadow-inner"
                                        placeholder="What's the latest deal? (Max 300 characters)"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        maxLength={300}
                                        required
                                    />
                                    <div className="absolute bottom-4 right-6 flex items-center gap-2">
                                        <div className={`h-1.5 w-1.5 rounded-full ${content.length > 250 ? 'bg-orange-500 animate-pulse' : 'bg-slate-200'}`} />
                                        <span className="text-[10px] font-black text-slate-400 tracking-tighter uppercase whitespace-nowrap">
                                            {content.length} / 300 Characters
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button type="submit" className="w-full sm:w-auto px-12 py-4 shadow-glow font-black tracking-wide" disabled={posting}>
                                        {posting ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                PUBLISHING...
                                            </span>
                                        ) : replyingTo ? 'POST REPLY' : 'SHARE MESSAGE'}
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
                </section>

                {/* Discussions Section */}
                <section className="space-y-8">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            Real-time Feed
                            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </h3>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            {messages.length} messages
                        </span>
                    </div>

                    {loading ? (
                        <div className="grid gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 glass rounded-3xl relative overflow-hidden">
                                    <div className="absolute inset-0 animate-shimmer" />
                                </div>
                            ))}
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-32 glass rounded-3xl border-2 border-dashed border-slate-200">
                            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl opacity-50">💬</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-700 mb-2">The floor is yours</h3>
                            <p className="text-slate-400 font-medium">Be the first to spark a conversation!</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {messages.map((msg) => {
                                const isOwner = (user && msg.userId === user.id) || 
                                              (!user && currentAnonId && msg.anonId === currentAnonId) || 
                                              (user?.role === 'admin');
                                const isHighlighted = highlightedMsgId === msg._id;

                                return (
                                <Card 
                                    key={msg._id} 
                                    id={`msg-${msg._id}`}
                                    className={`relative group p-8 hover:shadow-glow transition-all duration-500 hover:-translate-y-1 ${isHighlighted ? 'ring-4 ring-primary bg-primary/5 animate-pulse' : ''}`}
                                >
                                    <div className="flex gap-6 items-start">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex-shrink-0 flex items-center justify-center text-xl font-black text-slate-300 group-hover:bg-primary/5 group-hover:text-primary transition-colors duration-300">
                                            #
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="space-y-2 flex-1">
                                                    {msg.productId && (
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-widest">
                                                                {msg.productId.name}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400">
                                                                {formatPriceRange(msg.productId.price, msg.productId.maxPrice)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {msg.replyToContent && (
                                                        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg mb-2">
                                                            <span className="text-lg opacity-40">➥</span>
                                                            <p className="text-xs font-bold text-slate-400 italic">"{msg.replyToContent}"</p>
                                                        </div>
                                                    )}
                                                    <p className="text-slate-700 text-lg leading-relaxed font-medium whitespace-pre-wrap selection:bg-primary/10 antialiased">
                                                        {msg.content}
                                                    </p>
                                                </div>
                                                {msg.isAdmin && (
                                                    <span className="flex-shrink-0 bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-1 rounded-md tracking-tighter uppercase border border-amber-200 animate-pulse">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center pt-4 border-t border-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5">
                                                    🕰️ {formatRelativeTime(msg.createdAt)}
                                                </span>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => {
                                                            setReplyingTo(msg);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg hover:bg-primary/5 hover:text-primary transition-all duration-300 flex items-center gap-1.5"
                                                    >
                                                        REPLY
                                                    </button>
                                                    {isOwner && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setEditMessage(msg);
                                                                    setEditContent(msg.content);
                                                                }}
                                                                className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-all duration-300 flex items-center gap-1.5"
                                                            >
                                                                <Edit2 size={12} /> EDIT
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(msg._id)}
                                                                className="px-3 py-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-500 transition-all duration-300 flex items-center gap-1.5"
                                                            >
                                                                <Trash2 size={12} /> DELETE
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleReport(msg._id)}
                                                        className="px-3 py-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-500 transition-all duration-300"
                                                    >
                                                        REPORT
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )})}
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
        </div>
    );
}
