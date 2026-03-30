'use client';

import { useState } from 'react';
import { Button } from '@/components/ui-base';
import { Check, Users, Clock, Flame, ShieldCheck } from 'lucide-react';
import { formatPriceRange } from '@/lib/price-utils';
import { formatRelativeTime } from '@/lib/utils';

interface Proposal {
    _id: string;
    price: number;
    maxPrice?: number;
    userName: string;
    vouchCount: number;
    createdAt: string;
}

interface PriceProposalWidgetProps {
    productId: string;
    proposals: Proposal[];
    onVouchSuccess: () => void;
}

export function PriceProposalWidget({ productId, proposals, onVouchSuccess }: PriceProposalWidgetProps) {
    const [vouching, setVouching] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const latestProposal = proposals[0];

    if (!latestProposal) return null;

    const handleVouch = async (updateId: string) => {
        setVouching(updateId);
        setMessage(null);
        try {
            const res = await fetch(`/api/products/${productId}/vouch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updateId })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage('✓ Vouch recorded!');
                setTimeout(() => {
                    setMessage(null);
                    onVouchSuccess();
                }, 2000);
            } else {
                setMessage(data.error || 'Failed to vouch');
                setTimeout(() => setMessage(null), 3000);
            }
        } catch (error) {
            setMessage('Network error');
            setTimeout(() => setMessage(null), 3000);
        } finally {
            setVouching(null);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                
                <div className="relative glass bg-white/60 p-5 rounded-2xl shadow-premium border border-white/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Flame size={16} className="animate-pulse" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Proposal</h4>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">Community Active</p>
                            </div>
                        </div>
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                                    <Users size={10} className="text-slate-400" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black tracking-tighter text-slate-900">
                                {formatPriceRange(latestProposal.price, latestProposal.maxPrice)}
                            </span>
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                PROPOSED
                            </span>
                        </div>

                        <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {formatRelativeTime(latestProposal.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                                <ShieldCheck size={10} className="text-primary" />
                                {latestProposal.vouchCount} / 3 VOUCHES
                            </span>
                        </div>

                        <Button
                            onClick={() => handleVouch(latestProposal._id)}
                            disabled={vouching === latestProposal._id}
                            className="w-full bg-slate-900 hover:bg-black text-white font-black py-3 rounded-xl shadow-glow-sm transition-all group/btn flex items-center justify-center gap-2"
                        >
                            {vouching === latestProposal._id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>VOUCH FOR THIS</span>
                                    <Check size={14} className="group-hover/btn:scale-125 transition-transform" />
                                </>
                            )}
                        </Button>

                        {message && (
                            <p className="text-[9px] font-black text-center uppercase tracking-widest animate-in fade-in transition-all text-primary">
                                {message}
                            </p>
                        )}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-slate-100/50">
                        <p className="text-[8px] font-medium text-slate-400 text-center leading-relaxed">
                            Price updates for everyone once 3 community members vouch for this proposal.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
