'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui-base';

interface Request {
    _id: string;
    userId: { name: string; email: string };
    name: string;
    category: string;
    brand?: string;
    variant?: string;
    size?: string;
    status: string;
    createdAt: string;
}

export default function ProductRequestsAdmin() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/product-requests');
            const data = await res.json();
            if (Array.isArray(data)) {
                setRequests(data);
            }
        } catch (error) {
            console.error('Fetch failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id: string, status: 'approved' | 'denied') => {
        try {
            const res = await fetch(`/api/product-requests/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                fetchRequests();
            }
        } catch (error) {
            console.error('Action failed');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Product Requests</h1>

            {loading ? (
                <div className="text-center py-20">Loading requests...</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {requests.map(req => (
                        <Card key={req._id} className="p-6 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${req.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                            req.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                                'bg-rose-100 text-rose-600'
                                        }`}>
                                        {req.status}
                                    </span>
                                    <span className="text-xs text-slate-400 font-bold">
                                        Submitted by {req.userId?.name || 'Unknown'} on {new Date(req.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-slate-800">{req.name}</h3>
                                <div className="text-sm text-slate-500 font-medium mt-1">
                                    {req.category} | {req.brand || 'No Brand'} | {req.variant || 'No Variant'} | {req.size || 'No Size'}
                                </div>
                            </div>

                            {req.status === 'pending' && (
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => handleAction(req._id, 'denied')}>
                                        Deny
                                    </Button>
                                    <Button onClick={() => {
                                        // TODO: Open Add Product form with this data
                                        alert('Redirecting to create product (pre-filled)...');
                                        window.location.href = `/admin/products?name=${encodeURIComponent(req.name)}&category=${encodeURIComponent(req.category)}&brand=${encodeURIComponent(req.brand || '')}`;
                                    }}>
                                        Approve & Add
                                    </Button>
                                </div>
                            )}
                        </Card>
                    ))}
                    {requests.length === 0 && (
                        <div className="text-center py-20 text-slate-400 font-bold">No product requests yet.</div>
                    )}
                </div>
            )}
        </div>
    );
}
