'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui-base';

interface PriceUpdate {
    _id: string;
    product: {
        _id: string;
        name: string;
        price: number;
        imageUrl: string;
        category: string;
        flagged: boolean;
    };
    user: {
        _id: string;
        name: string;
        email: string;
        reputationLevel: string;
        points: number;
        isBanned: boolean;
    };
    price: number;
    status: string;
    createdAt: string;
}

export default function AdminVerificationQueue() {
    const [updates, setUpdates] = useState<PriceUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/verification');
            const data = await res.json();

            // Map the nested productId and userId to product and user for easier reading
            if (data.pendingUpdates) {
                const mapped = data.pendingUpdates.map((u: any) => ({
                    ...u,
                    product: u.productId,
                    user: u.userId
                }));
                setUpdates(mapped);
            }
        } catch (error) {
            console.error('Failed to fetch verification queue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        if (!confirm(`Are you sure you want to FORCE ${action.toUpperCase()} this price update?`)) return;

        setActionLoading(id);
        try {
            const res = await fetch(`/api/admin/verification/${id}/${action}`, {
                method: 'POST',
            });

            if (res.ok) {
                // Remove from local state
                setUpdates(prev => prev.filter(u => u._id !== id));
            } else {
                const data = await res.json();
                alert(data.error || `Failed to ${action} update`);
            }
        } catch (error) {
            console.error(`Failed to ${action} update`, error);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Verification Queue</h1>
                <Button onClick={fetchQueue} variant="secondary">Refresh Queue</Button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-4 shadow-sm text-amber-800">
                <div className="bg-amber-100 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-bold text-lg">Manual Interventions Required</h3>
                    <p className="text-sm font-medium opacity-80 mt-1">
                        These price updates are stuck in the queue. They either lack enough community votes to reach the verification threshold, or involve flagged products with massive price discrepancies. Manually intervening will override the community consensus.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-500">Loading queue...</div>
            ) : (
                <div className="space-y-4">
                    {updates.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-slate-100 shadow-premium">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-800">Queue is empty!</h3>
                            <p className="text-slate-500 font-medium">All price updates have been resolved automatically by the community.</p>
                        </div>
                    ) : (
                        updates.map((update) => (
                            <Card key={update._id} className={`p-6 border-l-4 shadow-premium ${update.product?.flagged ? 'border-l-rose-500' : 'border-l-amber-500'}`}>
                                <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">

                                    {/* Product Context */}
                                    <div className="flex items-center gap-4 flex-1">
                                        {update.product?.imageUrl ? (
                                            <img src={update.product.imageUrl} alt={update.product.name} className="w-16 h-16 rounded-xl object-cover bg-slate-100" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl bg-slate-100" />
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg text-slate-800">{update.product?.name || 'Unknown Product'}</h3>
                                                {update.product?.flagged && (
                                                    <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">Flagged</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium mt-1">Current verified price: <span className="font-black text-slate-700">₦{update.product?.price || 0}</span></p>
                                        </div>
                                    </div>

                                    {/* The Update Request */}
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex-1 text-center relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Proposed Price</p>
                                        <div className="text-3xl font-black text-primary">₦{update.price}</div>
                                        {update.product && (
                                            <div className="mt-2 text-xs font-bold text-slate-500">
                                                {(((update.price - update.product.price) / update.product.price) * 100).toFixed(1)}% change
                                            </div>
                                        )}
                                    </div>

                                    {/* Submitter Info */}
                                    <div className="flex-1 lg:text-right">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Submitted By</p>
                                        {update.user ? (
                                            <>
                                                <p className="font-bold text-slate-800">{update.user.name}</p>
                                                <div className="flex items-center lg:justify-end gap-2 mt-1">
                                                    <span className="text-xs font-bold text-slate-500 border border-slate-200 px-2 py-0.5 rounded bg-white">
                                                        {update.user.reputationLevel}
                                                    </span>
                                                    {update.user.isBanned && <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Banned</span>}
                                                </div>
                                            </>
                                        ) : (
                                            <p className="font-bold text-slate-500 italic">Unknown User</p>
                                        )}
                                        <p className="text-xs font-medium text-slate-400 mt-2">{new Date(update.createdAt).toLocaleString()}</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-32">
                                        <Button
                                            className="w-full shadow-md bg-emerald-500 hover:bg-emerald-600"
                                            disabled={actionLoading === update._id}
                                            onClick={() => handleAction(update._id, 'approve')}
                                        >
                                            {actionLoading === update._id ? 'Working...' : 'Approve'}
                                        </Button>
                                        <Button
                                            variant="danger"
                                            className="w-full"
                                            disabled={actionLoading === update._id}
                                            onClick={() => handleAction(update._id, 'reject')}
                                        >
                                            {actionLoading === update._id ? 'Working...' : 'Reject'}
                                        </Button>
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
