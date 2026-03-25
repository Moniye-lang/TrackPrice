'use client';

import { useSearchParams } from 'next/navigation';

export default function AdminProducts() {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [autoImageLoading, setAutoImageLoading] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [storeLocation, setStoreLocation] = useState('');

    useEffect(() => {
        // Pre-fill form from search params
        const nameParam = searchParams.get('name');
        const catParam = searchParams.get('category');
        const brandParam = searchParams.get('brand');

        if (nameParam || catParam || brandParam) {
            setName(nameParam || '');
            setCategory(catParam || '');
            // Brand isn't in the form fields yet but could be added to name or category if needed
            setShowForm(true);
        }
    }, [searchParams]);

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
        const payload = {
            name,
            price,
            category,
            imageUrl,
            storeLocation
        };

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

    const handleAutoImages = async () => {
        setAutoImageLoading(true);
        try {
            const res = await fetch('/api/admin/products/auto-images', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchProducts();
            } else {
                alert(data.error || 'Failed to auto-fetch images');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred during auto-fetching.');
        } finally {
            setAutoImageLoading(false);
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

    const handleDuplicate = async (id: string) => {
        if (!confirm('Are you sure you want to duplicate this product?')) return;
        try {
            const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: 'POST' });
            if (res.ok) {
                fetchProducts();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to duplicate product');
            }
        } catch (error) {
            console.error('Failed to duplicate product');
        }
    };

    const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);

    const handleMerge = async (targetId: string) => {
        if (!mergeSourceId || mergeSourceId === targetId) return;
        if (!confirm('Merge all price updates and messages from the source product into this one? The source product will be DELETED.')) return;
        try {
            const res = await fetch('/api/admin/products/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceId: mergeSourceId, targetId }),
            });
            if (res.ok) {
                setMergeSourceId(null);
                fetchProducts();
            } else {
                const data = await res.json();
                alert(data.error || 'Merge failed');
            }
        } catch (error) {
            console.error('Merge failed');
        }
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
                <div className="flex gap-4">
                    <Button onClick={handleAutoImages} disabled={autoImageLoading} variant="secondary">
                        {autoImageLoading ? 'Fetching Images...' : 'Auto-Fetch Missing Images'}
                    </Button>
                    <Button onClick={() => { setShowForm(true); setEditingProduct(null); resetForm(); }}>
                        Add New Product
                    </Button>
                </div>
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
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Price / Range (e.g. 1000 or 1000-2000)</label>
                            <Input value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="1000 or 1000-2000" />
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
                                    <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Featured</th>
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
                                        <td className="py-4 px-6 font-black text-slate-900">{formatPriceRange(product.price, product.maxPrice)}</td>
                                        <td className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            {new Date(product.lastUpdated).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={async () => {
                                                    const res = await fetch(`/api/products/${product._id}`, {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ isFeatured: !product.isFeatured }),
                                                    });
                                                    if (res.ok) fetchProducts();
                                                }}
                                                className={`w-10 h-6 rounded-full transition-colors relative ${product.isFeatured ? 'bg-primary' : 'bg-slate-200'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${product.isFeatured ? 'left-5' : 'left-1'}`} />
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                                            {mergeSourceId ? (
                                                mergeSourceId === product._id ? (
                                                    <button onClick={() => setMergeSourceId(null)} className="text-xs font-black text-rose-500 uppercase mr-3">Cancel Merge</button>
                                                ) : (
                                                    <button onClick={() => handleMerge(product._id)} className="text-xs font-black text-emerald-500 uppercase mr-3">Merge Into This</button>
                                                )
                                            ) : (
                                                <button onClick={() => setMergeSourceId(product._id)} className="text-xs font-black text-amber-500 hover:text-amber-700 uppercase tracking-widest mr-3">Merge</button>
                                            )}
                                            <button
                                                onClick={() => handleDuplicate(product._id)}
                                                className="text-xs font-black text-primary hover:text-primary/70 transition-colors uppercase tracking-widest mr-3"
                                            >
                                                Duplicate
                                            </button>
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
