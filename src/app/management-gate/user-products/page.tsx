'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, Button } from '@/components/ui-base';
import { Trash2, Shield, Users } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { formatPriceRange } from '@/lib/price-utils';

interface UserProduct {
    _id: string;
    name: string;
    price: number;
    category: string;
    lastUpdatedBy: string;
    createdAt: string;
}

export default function UserProductsAdminPage() {
    const [products, setProducts] = useState<UserProduct[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/user-products');
            const data = await res.json();
            if (res.ok) {
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === products.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(products.map(p => p._id));
        }
    };

    const handleMassDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) return;

        setDeleting(true);
        try {
            const res = await fetch('/api/user-products', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productIds: selectedIds })
            });

            if (res.ok) {
                alert('Products deleted successfully');
                setSelectedIds([]);
                fetchProducts();
            } else {
                alert('Failed to delete');
            }
        } catch (error) {
            console.error('Delete error', error);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <Users className="text-primary" /> User Added Products
                        </h1>
                        <p className="text-slate-500 font-medium">Manage products submitted directly by community members.</p>
                    </div>
                    {selectedIds.length > 0 && (
                        <Button 
                            onClick={handleMassDelete}
                            disabled={deleting}
                            className="bg-rose-500 hover:bg-rose-600 text-white shadow-premium flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Delete {selectedIds.length} Items {deleting && '...'}
                        </Button>
                    )}
                </div>

                <Card className="overflow-hidden bg-white/70 glass border-none shadow-premium p-0">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500 font-bold">Loading user products...</div>
                    ) : products.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 font-bold">No user-added products found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest">
                                        <th className="p-4 w-12">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.length === products.length && products.length > 0} 
                                                onChange={toggleSelectAll} 
                                                className="w-4 h-4 rounded border-slate-600 bg-slate-700" 
                                            />
                                        </th>
                                        <th className="p-4">Product Details</th>
                                        <th className="p-4">Price</th>
                                        <th className="p-4">Added By</th>
                                        <th className="p-4">Added On</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/10">
                                    {products.map((product) => (
                                        <tr key={product._id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(product._id) ? 'bg-primary/5' : ''}`}>
                                            <td className="p-4 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.includes(product._id)} 
                                                    onChange={() => toggleSelect(product._id)} 
                                                    className="w-4 h-4 rounded border-slate-200 text-primary focus:ring-primary" 
                                                />
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm font-black text-slate-800">{product.name}</p>
                                                <p className="text-xs font-bold text-slate-400 capitalize">{product.category}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm font-black text-primary">{formatPriceRange(product.price)}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-[10px] font-black text-slate-600 tracking-widest uppercase">
                                                    {product.lastUpdatedBy || 'Unknown User'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs font-bold text-slate-500">
                                                {formatRelativeTime(product.createdAt)}
                                            </td>
                                            <td className="p-4 text-right group">
                                                <Button 
                                                    onClick={() => toggleSelect(product._id)}
                                                    className="bg-transparent border border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 py-1.5 px-3 text-[10px] shadow-none"
                                                >
                                                    Select
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </main>
        </div>
    );
}
