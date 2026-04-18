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
    Activity,
    CheckSquare,
    Square,
    Check
} from 'lucide-react';

export default function ForumModeration() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const fetchMessages = async () => {
        setLoading(true);
        setError(null);
        setSelectedIds([]);
        try {
            const res = await fetch('/api/admin/messages');
            const data = await res.json();
            if (res.ok) {
                setMessages(Array.isArray(data) ? data : []);
            } else {
                setError(data.error || 'Failed to fetch messages');
                setMessages([]);
            }
        } catch (error) {
            console.error('Failed to fetch messages');
            setError('Network error or server unreachable');
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleDelete = async (id?: string) => {
        const idsToDelete = id ? [id] : selectedIds;
        if (idsToDelete.length === 0) return;

        const confirmMsg = id 
            ? 'Critical: Proceed with permanent message deletion?' 
            : `Critical: Proceed with permanent deletion of ${idsToDelete.length} messages?`;

        if (!confirm(confirmMsg)) return;

        try {
            const res = await fetch('/api/admin/messages' + (id ? `?id=${id}` : ''), { 
                method: 'DELETE',
                headers: id ? {} : { 'Content-Type': 'application/json' },
                body: id ? undefined : JSON.stringify({ ids: idsToDelete })
            });
            if (res.ok) {
                fetchMessages();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete');
            }
        } catch (error) {
            console.error('Failed to delete message');
            alert('A network error occurred');
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === messages.length && messages.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(messages.map(m => m._id));
        }
    };

    return (
        <div className="space-y-8 md:space-y-12 pb-20 max-w-5xl mx-auto px-4 md:px-0">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                     <nav className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Operations</span>
                    </nav>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
                        Forum <span className="text-primary italic">Moderation</span>
                    </h1>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                        onClick={fetchMessages} 
                        variant="secondary"
                        className="flex-1 md:flex-none bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2 px-6 py-3 rounded-2xl transition-all"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Refresh</span>
                    </Button>

                    {messages.length > 0 && (
                        <Button 
                            onClick={toggleSelectAll} 
                            variant="secondary"
                            className="flex-1 md:flex-none bg-slate-900 border-slate-800 text-white hover:bg-slate-800 shadow-premium flex items-center justify-center gap-2 px-6 py-3 rounded-2xl transition-all"
                        >
                            {selectedIds.length === messages.length ? <CheckSquare size={16} /> : <Square size={16} />}
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {selectedIds.length === messages.length ? 'Deselect All' : 'Select All'}
                            </span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Selection Toolbar (Floating on mobile, inline on desktop) */}
            {selectedIds.length > 0 && (
                <div className="sticky top-4 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-slate-900 text-white px-6 py-4 rounded-[2rem] shadow-2xl flex items-center justify-between gap-4 border border-white/10 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/20">
                                <Activity size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Bulk Actions Engaged</p>
                                <p className="text-white font-bold text-sm tracking-tight">{selectedIds.length} Messages Targetted</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setSelectedIds([])}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white px-4 py-2 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleDelete()}
                                className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/20"
                            >
                                <Trash2 size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Execute Purge</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-500 flex items-center justify-center shadow-sm border border-rose-200">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none mb-1">System Error Detected</p>
                        <p className="text-rose-600 font-bold text-sm tracking-tight">{error}</p>
                    </div>
                </div>
            )}

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
                <div className="space-y-4 md:space-y-6">
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
                            <Card 
                                key={msg._id} 
                                onClick={() => toggleSelect(msg._id)}
                                className={`p-0 border-none shadow-premium bg-white overflow-hidden rounded-[2rem] md:rounded-[2.5rem] group hover:scale-[1.01] md:hover:scale-[1.005] transition-all duration-500 relative cursor-pointer ${
                                    selectedIds.includes(msg._id) ? 'ring-2 ring-primary ring-inset ring-offset-4 ring-offset-slate-50' : ''
                                }`}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none group-hover:bg-primary/10 transition-colors" />
                                
                                <div className="flex flex-col md:flex-row items-stretch">
                                    {/* Selection Indicator */}
                                    <div className={`w-full md:w-16 flex items-center justify-center py-4 md:py-0 border-b md:border-b-0 md:border-r border-slate-100 transition-colors ${selectedIds.includes(msg._id) ? 'bg-primary/5' : 'bg-slate-50/30'}`}>
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                            selectedIds.includes(msg._id) 
                                                ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' 
                                                : 'bg-white border border-slate-200 text-slate-300 group-hover:border-primary/30 group-hover:text-primary/30'
                                        }`}>
                                            {selectedIds.includes(msg._id) ? <Check size={16} strokeWidth={4} /> : <div className="w-2 h-2 rounded-full bg-slate-100" />}
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6 md:p-8 space-y-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            {msg.productId && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                                                        <Box size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Related Entity</p>
                                                        <p className="text-xs font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
                                                            <span className="truncate">{msg.productId.name}</span>
                                                            <span className="text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10 shrink-0">
                                                                {formatPriceRange(msg.productId.price, msg.productId.maxPrice)}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-100 group-hover:bg-white transition-colors shrink-0">
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
                                            <p className="text-slate-700 text-lg md:text-xl font-bold leading-relaxed tracking-tight break-words">
                                                "{msg.content}"
                                            </p>
                                        </blockquote>
                                    </div>

                                    <div className="p-6 md:p-8 md:w-40 bg-slate-50/30 flex flex-row md:flex-col justify-between md:justify-center items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 text-left md:text-center leading-tight md:order-2">
                                            Single<br className="hidden md:block"/>Purge
                                        </p>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(msg._id);
                                            }}
                                            className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white border border-slate-200 text-slate-300 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 shadow-sm flex items-center justify-center transition-all hover:scale-110 active:scale-90 group/del md:order-1"
                                        >
                                            <Trash2 size={24} className="group-hover/del:animate-pulse" />
                                        </button>
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
