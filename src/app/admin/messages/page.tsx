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
        if (!confirm('Are you sure you want to delete this message?')) return;
        try {
            const res = await fetch(`/api/admin/messages?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchMessages();
        } catch (error) {
            console.error('Failed to delete message');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Forum Moderation</h1>

            {loading ? (
                <div className="text-center py-10 font-medium text-slate-500">Loading messages...</div>
            ) : (
                <div className="space-y-6">
                    {messages.length === 0 ? (
                        <Card className="py-12 text-center text-slate-400 font-medium border-dashed border-2">No messages found.</Card>
                    ) : (
                        messages.map((msg) => (
                            <Card key={msg._id} className="flex justify-between items-start gap-6 p-6 hover:shadow-premium transition-all">
                                <div className="flex-1 space-y-3">
                                    {msg.productId && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-widest">
                                                {msg.productId.name}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                Current Price: {formatPriceRange(msg.productId.price, msg.productId.maxPrice)}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-slate-700 text-lg font-medium leading-relaxed">{msg.content}</p>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>{new Date(msg.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                                <Button variant="danger" onClick={() => handleDelete(msg._id)} className="px-4 py-2 text-xs font-bold tracking-wide">
                                    Delete
                                </Button>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
