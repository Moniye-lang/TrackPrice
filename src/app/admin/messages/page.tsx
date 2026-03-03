'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui-base';

interface Message {
    _id: string;
    content: string;
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
            <h1 className="text-2xl font-bold">Forum Moderation</h1>

            {loading ? (
                <div className="text-center py-10">Loading messages...</div>
            ) : (
                <div className="space-y-4">
                    {messages.length === 0 ? (
                        <p className="text-gray-500">No messages found.</p>
                    ) : (
                        messages.map((msg) => (
                            <Card key={msg._id} className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <p className="text-gray-800">{msg.content}</p>
                                    <span className="text-xs text-gray-500 mt-2 block">
                                        {new Date(msg.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <Button variant="danger" onClick={() => handleDelete(msg._id)} className="px-3 py-1 text-sm">
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
