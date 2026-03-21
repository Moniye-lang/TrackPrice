'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui-base';
import { Navbar } from '@/components/Navbar';

export default function SettingsPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setName(data.user.name);
                    setCity(data.user.city || '');
                }
            } catch (error) {
                console.error('Failed to fetch user');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, city }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setTimeout(() => router.push('/profile'), 2000);
            } else {
                setMessage({ type: 'error', text: 'Failed to update profile.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center py-20">Loading settings...</div>;

    return (
        <>
            <Navbar />
            <div className="max-w-2xl mx-auto py-12 px-4">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-8">Account Settings</h1>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 font-bold text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {message.text}
                    </div>
                )}

                <Card className="p-8 shadow-premium border-none">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Display Name</label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Your City (Nigeria)</label>
                            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lagos, Abuja, Port Harcourt" />
                            <p className="text-[10px] font-bold text-slate-400 mt-2">Setting your city allows you to compete on regional leaderboards!</p>
                        </div>

                        <div className="pt-6 flex gap-3">
                            <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1 py-4 font-black uppercase text-xs">
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 py-4 font-black uppercase text-xs shadow-glow" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </>
    );
}
