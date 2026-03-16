'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Card } from '@/components/ui-base';

interface Rules {
    pointsPerUpdate: number;
    bonusPointsRequest: number;
    dailyUpdateLimit: number;
    verificationThreshold: number;
}

export default function AdminSettings() {
    const [rules, setRules] = useState<Rules | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/gamification');
            if (res.ok) {
                const data = await res.json();
                setRules(data);
            }
        } catch (error) {
            console.error('Failed to fetch rules');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleChange = (key: keyof Rules, value: string) => {
        if (!rules) return;
        setRules({ ...rules, [key]: Number(value) });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setSaving(true);

        try {
            const res = await fetch('/api/admin/gamification', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rules),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Gamification rules updated successfully!' });
                window.scrollTo(0, 0);
            } else {
                setMessage({ type: 'error', text: 'Failed to update Gamification rules.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center py-20 text-slate-500 font-medium">Loading Gamification Rules...</div>;
    }

    if (!rules) {
        return <div className="text-center py-20 text-rose-500 font-bold bg-rose-50 rounded-xl">Failed to load gamification settings. Check server connection.</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gamification Settings</h1>
                <p className="text-slate-500 font-medium mt-2">Adjust the behavioral economy of the TrackPrice community. Changes apply immediately to all users.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">

                {/* Points Configuration */}
                <Card className="p-8 border-none shadow-premium bg-white">
                    <h2 className="text-xl font-black tracking-tight text-slate-800 mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Reward Economy
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-black text-slate-800 tracking-widest uppercase mb-2">Base Points Per Update</label>
                            <Input
                                type="number"
                                min="0"
                                className="text-lg font-bold shadow-sm"
                                value={rules.pointsPerUpdate}
                                onChange={(e) => handleChange('pointsPerUpdate', e.target.value)}
                                required
                            />
                            <p className="text-xs font-medium text-slate-500 mt-2">Points awarded when a submitted price becomes verified.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-black text-slate-800 tracking-widest uppercase mb-2">Bonus: Price Request</label>
                            <Input
                                type="number"
                                min="0"
                                className="text-lg font-bold shadow-sm border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                                value={rules.bonusPointsRequest}
                                onChange={(e) => handleChange('bonusPointsRequest', e.target.value)}
                                required
                            />
                            <p className="text-xs font-medium text-slate-500 mt-2">Extra points awarded for fulfilling community "Price Requests".</p>
                        </div>
                    </div>
                </Card>

                {/* Abuse limits Configuration */}
                <Card className="p-8 border-none shadow-premium bg-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <h2 className="text-xl font-black tracking-tight text-slate-800 mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Security & Limits
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-black text-slate-800 tracking-widest uppercase mb-2">Daily Update Limit</label>
                            <Input
                                type="number"
                                min="1"
                                className="text-lg font-bold shadow-sm"
                                value={rules.dailyUpdateLimit}
                                onChange={(e) => handleChange('dailyUpdateLimit', e.target.value)}
                                required
                            />
                            <p className="text-xs font-medium text-slate-500 mt-2">Maximum number of rewarded price updates a single user can make per day. Prevents spam farming.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-black text-slate-800 tracking-widest uppercase mb-2">Verification Threshold</label>
                            <Input
                                type="number"
                                min="1"
                                className="text-lg font-bold shadow-sm"
                                value={rules.verificationThreshold}
                                onChange={(e) => handleChange('verificationThreshold', e.target.value)}
                                required
                            />
                            <p className="text-xs font-medium text-slate-500 mt-2">
                                Reputation weight required to verify a price. (Beginner=1, Trusted=3, Elite=10).
                                <br /><i>Example: 5 means five beginners, or one beginner+one trusted+one something else.</i>
                            </p>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button type="submit" className="px-8 py-3 text-lg font-black tracking-widest uppercase" disabled={saving}>
                        {saving ? 'Applying...' : 'Save & Apply Rules'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
