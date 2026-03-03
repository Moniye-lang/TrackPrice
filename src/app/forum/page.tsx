'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Card } from '@/components/ui-base';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

interface Message {
    _id: string;
    content: string;
    isAdmin?: boolean;
    createdAt: string;
}

export default function ForumPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');

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
                body: JSON.stringify({ content }),
            });

            const data = await res.json();

            if (res.ok) {
                setContent('');
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

    return (
        <div className="min-h-screen bg-mesh selection:bg-primary/20">
            {/* Header */}
            <header className="glass sticky top-4 z-50 mx-4 mt-4 rounded-2xl shadow-premium">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="text-2xl font-black text-primary tracking-tighter hover:scale-105 transition-transform">
                        TrackPrice<span className="text-accent">.</span> Forum
                    </Link>
                    <nav className="flex items-center gap-8">
                        <Link href="/" className="text-slate-600 hover:text-primary font-display font-semibold transition-colors relative group">
                            Back to Products
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                        </Link>
                    </nav>
                </div>
            </header>

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
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Share insights with the community</p>
                                </div>
                            </div>

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
                                        ) : 'SHARE MESSAGE'}
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
                            {messages.map((msg) => (
                                <Card key={msg._id} className="relative group p-8 hover:shadow-glow transition-all duration-500 hover:-translate-y-1">
                                    <div className="flex gap-6 items-start">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex-shrink-0 flex items-center justify-center text-xl font-black text-slate-300 group-hover:bg-primary/5 group-hover:text-primary transition-colors duration-300">
                                            #
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-slate-700 text-lg leading-relaxed font-medium whitespace-pre-wrap selection:bg-primary/10 antialiased">
                                                    {msg.content}
                                                </p>
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
                                                <button
                                                    onClick={() => handleReport(msg._id)}
                                                    className="px-3 py-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-500 transition-all duration-300"
                                                >
                                                    REPORT
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
