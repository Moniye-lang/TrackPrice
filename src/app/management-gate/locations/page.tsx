'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input } from '@/components/ui-base';
import { MapPin, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LocationManagement() {
    const [areas, setAreas] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [state, setState] = useState<'Oyo' | 'Lagos'>('Oyo');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchAreas = async () => {
        try {
            const res = await fetch('/api/admin/locations');
            if (res.ok) {
                const data = await res.json();
                setAreas(data.areas);
            }
        } catch (error) {
            console.error('Failed to fetch areas', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAreas();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, state })
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Area added successfully!' });
                setName('');
                fetchAreas();
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to add area.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this area?')) return;

        try {
            const res = await fetch('/api/admin/locations', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                fetchAreas();
            }
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400 font-bold">Loading Locations...</div>;

    return (
        <div className="space-y-12 pb-20">
            <div>
                <nav className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Location Management</span>
                </nav>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                    Areas & <span className="text-primary italic">Regions</span>
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Add New Area */}
                <Card className="p-8 border-none shadow-premium bg-white h-fit">
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
                        <Plus size={20} className="text-primary" />
                        Add New Area
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">State</label>
                            <select
                                value={state}
                                onChange={(e) => setState(e.target.value as 'Oyo' | 'Lagos')}
                                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                                <option value="Oyo">Oyo</option>
                                <option value="Lagos">Lagos</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Area Name</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Bodija, Ikeja"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full py-4 text-xs font-black uppercase tracking-widest shadow-glow" disabled={submitting}>
                            {submitting ? 'Adding...' : 'Save Area'}
                        </Button>
                        {message && (
                            <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                {message.text}
                            </div>
                        )}
                    </form>
                </Card>

                {/* Area List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['Oyo', 'Lagos'].map((s) => (
                            <Card key={s} className="p-8 border-none shadow-premium bg-white min-h-[400px]">
                                <h3 className="text-base font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <MapPin size={18} className="text-primary" />
                                        {s}
                                    </span>
                                    <span className="text-[10px] bg-slate-50 text-slate-400 px-3 py-1 rounded-full">
                                        {areas.filter(a => a.state === s).length} Areas
                                    </span>
                                </h3>
                                <div className="space-y-2">
                                    {areas.filter(a => a.state === s).map((area) => (
                                        <div key={area._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                                            <span className="text-sm font-bold text-slate-600">{area.name}</span>
                                            <button
                                                onClick={() => handleDelete(area._id)}
                                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {areas.filter(a => a.state === s).length === 0 && (
                                        <div className="text-center py-12 text-slate-300 italic text-sm">No areas documented yet.</div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
