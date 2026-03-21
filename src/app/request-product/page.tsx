'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui-base';
import { Navbar } from '@/components/Navbar';

export default function RequestProductPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [brand, setBrand] = useState('');
    const [variant, setVariant] = useState('');
    const [size, setSize] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch('/api/product-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, category, brand, variant, size }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Thank you! Your request has been submitted to moderators.' });
                setTimeout(() => router.push('/'), 3000);
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to submit request.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="max-w-2xl mx-auto py-12 px-4">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Request a Product</h1>
                <p className="text-slate-500 font-medium mb-8">Can't find a product? Tell us what's missing and our moderators will add it to the platform.</p>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 font-bold text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {message.text}
                    </div>
                )}

                <Card className="p-8 shadow-premium border-none">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Product Name (Required)</label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Indomie Hungry Man" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Category (Required)</label>
                                <Input value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="e.g. Noodles" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Brand</label>
                                <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Indomie" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Variant</label>
                                <Input value={variant} onChange={(e) => setVariant(e.target.value)} placeholder="e.g. Onion Flavor" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Size / Weight</label>
                                <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. 210g" />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full py-4 text-sm font-black tracking-widest uppercase shadow-glow" disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </>
    );
}
