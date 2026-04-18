'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Card } from '@/components/ui-base';

interface Rules {
    pointsPerUpdate: number;
    bonusPointsRequest: number;
    dailyUpdateLimit: number;
    verificationThreshold: number;
    forumLocked: boolean;
    forumLockedMessage: string;
}

import { 
    ShieldCheck, 
    Coins, 
    Target, 
    Zap, 
    Lock, 
    RefreshCw, 
    CheckCircle2, 
    XCircle,
    Save,
    Settings,
    LayoutDashboard,
    AlertCircle,
    Clock,
    Database,
    History
} from 'lucide-react';

export default function AdminSettings() {
    const [rules, setRules] = useState<Rules | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [archiving, setArchiving] = useState(false);
    const [archiveMessage, setArchiveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

    const handleChange = (key: keyof Rules, value: string | boolean) => {
        if (!rules) return;
        setRules({ ...rules, [key]: value });
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
                setMessage({ type: 'success', text: 'Protocol parameters updated successfully.' });
                window.scrollTo(0, 0);
                setTimeout(() => setMessage(null), 5000);
            } else {
                setMessage({ type: 'error', text: 'Failed to synchronize parameters with registry.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network exception during protocol synchronization.' });
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async () => {
        if (!confirm('Are you sure you want to archive legacy protocols? This action will permanently remove historical records older than 30 days.')) return;
        
        setArchiving(true);
        setArchiveMessage(null);

        try {
            const res = await fetch('/api/admin/archive', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                setArchiveMessage({ 
                    type: 'success', 
                    text: `Registry cleanup complete. Archived ${data.count} legacy protocols.` 
                });
                setTimeout(() => setArchiveMessage(null), 10000);
            } else {
                setArchiveMessage({ type: 'error', text: data.error || 'Registry archival failed.' });
            }
        } catch (error) {
            setArchiveMessage({ type: 'error', text: 'Network exception during archival protocol.' });
        } finally {
            setArchiving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="animate-pulse flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Community Protocols</p>
            </div>
        );
    }

    if (!rules) {
        return (
            <div className="text-center py-32 bg-rose-50 rounded-[2.5rem] border border-rose-100 mt-12">
                <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-rose-200">
                    <AlertCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-rose-900 tracking-tight">Access Restricted</h3>
                <p className="text-rose-400 font-bold text-[10px] uppercase tracking-widest mt-2">Failed to retrieve gamification protocols from registry</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20 max-w-5xl">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                     <nav className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">System Engine</span>
                    </nav>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        Protocol <span className="text-primary italic">Settings</span>
                    </h1>
                </div>
                <p className="text-slate-400 text-sm font-bold max-w-sm md:text-right leading-relaxed">
                    Fine-tune the behavioral economy and security thresholds of the TrackPricely community ecosystem.
                </p>
            </div>

            {message && (
                <div className={`p-6 rounded-3xl border flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 ${
                    message.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm' 
                    : 'bg-rose-50 text-rose-700 border-rose-100 shadow-sm'
                }`}>
                    {message.type === 'success' ? <CheckCircle2 className="text-emerald-500" /> : <XCircle className="text-rose-500" />}
                    <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-10">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    
                    {/* Economy Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2 px-2">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shadow-sm">
                                <Coins size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight">Reward Economy</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incentive distribution parameters</p>
                            </div>
                        </div>

                        <Card className="p-8 border-none shadow-premium bg-white rounded-[2.5rem] space-y-8">
                            <div className="space-y-4">
                                <label className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Points / Update</span>
                                    <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-lg">Standard Reward</span>
                                </label>
                                <div className="relative group">
                                    <Input
                                        type="number"
                                        min="0"
                                        className="h-16 pl-6 pr-12 text-2xl font-black bg-slate-50 border-transparent focus:bg-white focus:border-primary transition-all rounded-2xl shadow-inner group-hover:bg-white"
                                        value={rules.pointsPerUpdate}
                                        onChange={(e) => handleChange('pointsPerUpdate', Number(e.target.value))}
                                        required
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                                        <Zap size={20} />
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed px-2">
                                    Foundation points awarded to contributors when their price data passes the verification threshold.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Request Fulfillment Bonus</span>
                                    <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">Premium Yield</span>
                                </label>
                                <div className="relative group">
                                    <Input
                                        type="number"
                                        min="0"
                                        className="h-16 pl-6 pr-12 text-2xl font-black bg-slate-50 border-transparent focus:bg-white focus:border-amber-400 transition-all rounded-2xl shadow-inner group-hover:bg-white"
                                        value={rules.bonusPointsRequest}
                                        onChange={(e) => handleChange('bonusPointsRequest', Number(e.target.value))}
                                        required
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors">
                                        <Target size={20} />
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed px-2">
                                    Additional multiplier applied when a user fulfills a community "Price Request" for a specific product.
                                </p>
                            </div>
                        </Card>
                    </div>

                    {/* Security Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2 px-2">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100 shadow-sm">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight">Security & Governance</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anti-Abuse & Verification Logic</p>
                            </div>
                        </div>

                        <Card className="p-8 border-none shadow-premium bg-white rounded-[2.5rem] space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                            
                            <div className="space-y-4 relative z-10">
                                <label className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Daily Global Limit</span>
                                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">Rate Limiter</span>
                                </label>
                                <div className="relative group">
                                    <Input
                                        type="number"
                                        min="1"
                                        className="h-16 pl-6 pr-12 text-2xl font-black bg-slate-50 border-transparent focus:bg-white focus:border-indigo-400 transition-all rounded-2xl shadow-inner group-hover:bg-white"
                                        value={rules.dailyUpdateLimit}
                                        onChange={(e) => handleChange('dailyUpdateLimit', Number(e.target.value))}
                                        required
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                                        <Clock size={20} />
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed px-2">
                                    Hard cap onRewarded updates per user within a 24h cycle to prevent automated farming and syndicate manipulation.
                                </p>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <label className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verification Threshold</span>
                                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">Consensus Req.</span>
                                </label>
                                <div className="relative group">
                                    <Input
                                        type="number"
                                        min="1"
                                        className="h-16 pl-6 pr-12 text-2xl font-black bg-slate-50 border-transparent focus:bg-white focus:border-indigo-400 transition-all rounded-2xl shadow-inner group-hover:bg-white"
                                        value={rules.verificationThreshold}
                                        onChange={(e) => handleChange('verificationThreshold', Number(e.target.value))}
                                        required
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed px-2">
                                    Total reputation weight required for auto-verification. (Beginner=1, Trusted=3, Elite=10). Higher values ensure total accuracy.
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* System Maintenance Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2 px-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200 shadow-sm transition-colors hover:bg-slate-200">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">System Maintenance</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Health & Data Archival</p>
                        </div>
                    </div>

                    <Card className="p-8 border-none shadow-premium bg-white rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute -right-8 -bottom-8 text-slate-50 group-hover:text-slate-100 transition-colors pointer-events-none">
                            <Database size={160} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                            <div className="md:col-span-8 space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Archive Legacy Protocols</h3>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed max-w-xl">
                                    Trigger a recursive archival protocol to prune the primary registry of verified or rejected price updates older than 30 days. This operation optimizes query performance and maintains data integrity standards.
                                </p>
                                
                                {archiveMessage && (
                                    <div className={`mt-4 p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500 ${
                                        archiveMessage.type === 'success' 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                        : 'bg-rose-50 text-rose-700 border-rose-100'
                                    }`}>
                                        {archiveMessage.type === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                        <span className="text-[10px] font-black uppercase tracking-widest">{archiveMessage.text}</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="md:col-span-4">
                                <Button 
                                    type="button"
                                    onClick={handleArchive}
                                    disabled={archiving}
                                    className="w-full h-16 rounded-2xl bg-white border-2 border-slate-200 text-slate-900 font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {archiving ? (
                                        <RefreshCw className="animate-spin text-primary" size={18} />
                                    ) : (
                                        <History size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
                                    )}
                                    {archiving ? 'Processing' : 'Archive Registry'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Forum Governance Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2 px-2">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 shadow-sm">
                            <Lock size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Forum Governance</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access control & Maintenance messaging</p>
                        </div>
                    </div>

                    <Card className="p-8 border-none shadow-premium bg-white rounded-[2.5rem] space-y-8 relative overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <div className="space-y-1">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Lock Public Discussions</h3>
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed max-w-md">
                                    When enabled, all non-admin users will be prevented from posting messages, replies, or editing content across the ecosystem.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleChange('forumLocked', !rules.forumLocked)}
                                className={`w-16 h-8 rounded-full transition-all duration-500 relative ${rules.forumLocked ? 'bg-rose-500 shadow-glow-sm' : 'bg-slate-200'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-500 ${rules.forumLocked ? 'left-9' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Maintenance Broadcast Message</span>
                                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100 uppercase tracking-widest">Global Alert</span>
                            </label>
                            <div className="relative group">
                                <textarea
                                    className="w-full p-6 text-sm font-bold bg-slate-50 border-transparent focus:bg-white focus:border-rose-400 transition-all rounded-3xl shadow-inner group-hover:bg-white min-h-[120px] resize-none text-slate-700 outline-none"
                                    value={rules.forumLockedMessage}
                                    onChange={(e) => handleChange('forumLockedMessage', e.target.value)}
                                    placeholder="Enter custom maintenance message..."
                                    required
                                />
                                <div className="absolute right-6 bottom-6 text-slate-300 group-focus-within:text-rose-500 transition-colors">
                                    <AlertCircle size={20} />
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed px-2">
                                This message will be displayed prominently on the Forum and Product pages when discussions are restricted.
                            </p>
                        </div>
                    </Card>
                </div>

                <div className="flex items-center justify-center pt-8">
                    <Button 
                        type="submit" 
                        disabled={saving}
                        className="h-20 px-12 rounded-[2rem] bg-slate-900 text-white font-black uppercase tracking-[0.2em] shadow-glow flex items-center gap-4 hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
                    >
                        {saving ? (
                            <>
                                <RefreshCw className="animate-spin text-primary" size={24} />
                                <span>Synchronizing...</span>
                            </>
                        ) : (
                            <>
                                <Save className="text-primary" size={24} />
                                <span>Save & Deploy Protocols</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
