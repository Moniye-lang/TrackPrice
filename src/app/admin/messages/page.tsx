'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui-base';
import { formatPriceRange } from '@/lib/price-utils';

interface Message {
    _id: string;
    content: string;
    productId?: {
        _id: string;
        name: string;
        price: number;
        maxPrice?: number;
    };
    createdAt: string;
}

import { 
    MessageSquare, 
    Trash2, 
    Box, 
    Calendar, 
    Clock, 
    RefreshCw, 
    ShieldAlert, 
    User, 
    ArrowRight,
    Search,
    Filter,
    Activity
} from 'lucide-react';

export default function ForumModeration() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/messages');
            const data = await res.json();
            setMessages(data);
        } catch (error) {
            console.error('Failed to fetch messages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Critical: Proceed with permanent message deletion?')) return;
        try {
            const res = await fetch(`/api/admin/messages?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchMessages();
        } catch (error) {
            console.error('Failed to delete message');
        }
    };

    return (
        <div className="space-y-12 pb-20 max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                     <nav className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Operations</span>
                    </nav>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        Forum <span className="text-primary italic">Moderation</span>
                    </h1>
                </div>
                <Button 
                    onClick={fetchMessages} 
                    variant="secondary"
                    className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 px-6 py-3 rounded-2xl transition-all"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Refresh Feed</span>
                </Button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="animate-pulse flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Protocol Logs</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {messages.length === 0 ? (
                        <div className="text-center py-32 bg-white rounded-[2.5rem] shadow-premium border border-slate-100">
                            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                                <MessageSquare size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Feed is Clear</h3>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">No community messages detected in this sector</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <Card key={msg._id} className="p-0 border-none shadow-premium bg-white overflow-hidden rounded-[2.5rem] group hover:scale-[1.01] transition-all duration-500 relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none group-hover:bg-primary/10 transition-colors" />
                                
                                <div className="flex flex-col md:flex-row items-stretch">
                                    <div className="flex-1 p-8 space-y-6">
                                        <div className="flex items-center justify-between">
                                            {msg.productId && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                                                        <Box size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Related Entity</p>
                                                        <p className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-2">
                                                            {msg.productId.name}
                                                            <span className="text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                                                                {formatPriceRange(msg.productId.price, msg.productId.maxPrice)}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
                                                <div className="flex items-center gap-1.5 border-r border-slate-200 pr-4">
                                                    <Calendar size={12} className="text-slate-300" />
                                                    {new Date(msg.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1.5 pl-2">
                                                    <Clock size={12} className="text-slate-300" />
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>

                                        <blockquote className="relative">
                                            <div className="absolute -left-4 top-0 h-full w-1 bg-gradient-to-b from-primary/40 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <p className="text-slate-700 text-xl font-bold leading-relaxed tracking-tight">
                                                "{msg.content}"
                                            </p>
                                        </blockquote>
                                    </div>

                                    <div className="p-8 md:w-48 bg-slate-50/30 flex flex-col justify-center items-center gap-4">
                                        <button 
                                            onClick={() => handleDelete(msg._id)}
                                            className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-300 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 shadow-sm flex items-center justify-center transition-all hover:scale-110 active:scale-90 group/del"
                                        >
                                            <Trash2 size={24} className="group-hover/del:animate-pulse" />
                                        </button>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 text-center leading-tight">
                                            Execute<br/>Purge
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
