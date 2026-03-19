'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Card } from '@/components/ui-base';

interface Product {
    _id: string;
    name: string;
    price: number;
    category: string;
    imageUrl: string;
    storeLocation?: string;
    lastUpdated: string;
}

export default function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [storeLocation, setStoreLocation] = useState('');

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            if (Array.isArray(data)) {
                setProducts(data);
            }
        } catch (error) {
            console.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        const payload = { name, price: Number(price), category, imageUrl, storeLocation };

        try {
            const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products';
            const method = editingProduct ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                setShowForm(false);
                setEditingProduct(null);
                resetForm();
                fetchProducts();
            } else {
                setError(data.error || data.details || 'Failed to save product');
            }
        } catch (error) {
            console.error('Failed to save product');
            setError('An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setName(product.name);
        setPrice(product.price.toString());
        setCategory(product.category);
        setImageUrl(product.imageUrl);
        setStoreLocation(product.storeLocation || '');
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (res.ok) fetchProducts();
        } catch (error) {
            console.error('Failed to delete product');
        }
    };

    const resetForm = () => {
        setName('');
        setPrice('');
        setCategory('');
        setImageUrl('');
        setStoreLocation('');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manage Products</h1>
                <Button onClick={() => { setShowForm(true); setEditingProduct(null); resetForm(); }}>
                    Add New Product
                </Button>
            </div>

            {showForm && (
                <Card className="max-w-2xl mx-auto p-6">
                    <h2 className="text-xl font-bold mb-6 text-slate-800">
                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Product Name</label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Rice 50kg" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Base Price (₦)</label>
                            <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Category</label>
                            <Input value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="e.g. Groceries" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Image URL</label>
                            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required placeholder="https://..." />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Store / Market / Location</label>
                            <Input value={storeLocation} onChange={(e) => setStoreLocation(e.target.value)} placeholder="e.g. Mile 12 Market, Shoprite" />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setError(null); }} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting} className="shadow-lg">
                                {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {loading ? (
                <div className="text-center py-10 text-slate-500">Loading products...</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <Card className="overflow-x-auto p-0 border-none shadow-premium">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Name</th>
                                    <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Category</th>
                                    <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Store</th>
                                    <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Price</th>
                                    <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Last Updated</th>
                                    <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="font-bold text-slate-800">{product.name}</span>
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 font-medium">{product.category}</td>
                                        <td className="py-4 px-6 text-slate-500 text-sm italic">{product.storeLocation || 'N/A'}</td>
                                        <td className="py-4 px-6 font-black text-slate-900">₦{product.price.toFixed(2)}</td>
                                        <td className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            {new Date(product.lastUpdated).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6 text-right space-x-2">
                                            <Button variant="secondary" onClick={() => handleEdit(product)} className="px-3 py-1.5 text-xs font-bold">
                                                Edit
                                            </Button>
                                            <Button variant="danger" onClick={() => handleDelete(product._id)} className="px-3 py-1.5 text-xs font-bold">
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">No products found. Add one above.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </Card>
                </div>
            )}
        </div>
    );
}
