'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui-base';
import { Navbar } from '@/components/Navbar';

export default function AddProductPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [storeLocation, setStoreLocation] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch('/api/user-products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, category, price: Number(price), imageUrl, storeLocation })
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Product added successfully!' });
                setTimeout(() => router.push(`/product/${data.product._id}`), 2000);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to add product.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-mesh pb-32">
            <Navbar />
            <div className="max-w-2xl mx-auto py-12 px-4">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Add a New Product</h1>
                <p className="text-slate-500 font-medium mb-8">Know a product that is missing? Add it directly to TrackPricely.</p>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 font-bold text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {message.text}
                    </div>
                )}

                <Card className="p-8 shadow-premium border-none bg-white/80 glass">
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
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Price (₦) (Required)</label>
                                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="e.g. 500" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Image URL (Optional)</label>
                            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Store Location (Where seen)</label>
                            <Input value={storeLocation} onChange={(e) => setStoreLocation(e.target.value)} placeholder="e.g. Shoprite, Dugbe" />
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full py-4 text-sm font-black tracking-widest uppercase shadow-glow" disabled={submitting}>
                                {submitting ? 'Adding...' : 'Add Product'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
