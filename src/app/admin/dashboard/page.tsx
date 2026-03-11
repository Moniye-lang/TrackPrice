'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Card } from '@/components/ui-base';

interface Product {
    _id: string;
    name: string;
    price: number;
    category: string;
    imageUrl: string;
    lastUpdated: string;
}

export default function AdminDashboard() {
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

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            setProducts(data);
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
        const payload = { name, price: Number(price), category, imageUrl };

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
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Manage Products</h1>
                <Button onClick={() => { setShowForm(true); setEditingProduct(null); resetForm(); }}>
                    Add New Product
                </Button>
            </div>

            {showForm && (
                <Card className="max-w-2xl mx-auto">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Product Name</label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Price (₦)</label>
                            <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <Input value={category} onChange={(e) => setCategory(e.target.value)} required />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Image URL</label>
                            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setError(null); }} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {loading ? (
                <div className="text-center py-10">Loading products...</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <Card className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b">
                                <tr>
                                    <th className="py-2 px-4">Name</th>
                                    <th className="py-2 px-4">Category</th>
                                    <th className="py-2 px-4">Price</th>
                                    <th className="py-2 px-4">Last Updated</th>
                                    <th className="py-2 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product._id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4 flex items-center gap-3">
                                            <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded object-cover" />
                                            <span className="font-medium">{product.name}</span>
                                        </td>
                                        <td className="py-3 px-4">{product.category}</td>
                                        <td className="py-3 px-4 font-bold">₦{product.price.toFixed(2)}</td>
                                        <td className="py-3 px-4 text-sm text-gray-500">
                                            {new Date(product.lastUpdated).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right space-x-2">
                                            <Button variant="secondary" onClick={() => handleEdit(product)} className="px-3 py-1">
                                                Edit
                                            </Button>
                                            <Button variant="danger" onClick={() => handleDelete(product._id)} className="px-3 py-1">
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            )}
        </div>
    );
}
