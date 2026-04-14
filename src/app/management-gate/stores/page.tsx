'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input } from '@/components/ui-base';
import { 
    Store, 
    Plus, 
    Trash2, 
    Edit2, 
    MapPin, 
    Search, 
    Filter,
    Image as ImageIcon,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    X
} from 'lucide-react';

export default function StoreManagement() {
    const [stores, setStores] = useState<any[]>([]);
    const [areasByState, setAreasByState] = useState<{ [key: string]: any[] }>({ 'Oyo': [], 'Lagos': [] });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterState, setFilterState] = useState<string>('All');
    
    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        area: '',
        city: 'Oyo', // City field in model used for State
        type: 'Supermarket',
        imageUrl: ''
    });
    
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all stores
            const storeRes = await fetch('/api/admin/stores');
            if (storeRes.ok) {
                const data = await storeRes.json();
                setStores(data);
            }

            // Fetch areas for dropdowns
            const oyoRes = await fetch('/api/locations?state=Oyo');
            const lagosRes = await fetch('/api/locations?state=Lagos');
            
            const oyoData = await oyoRes.json();
            const lagosData = await lagosRes.json();

            setAreasByState({
                'Oyo': oyoData.areas || [],
                'Lagos': lagosData.areas || []
            });

        } catch (error) {
            console.error('Failed to fetch store data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setFormData({ name: '', area: '', city: 'Oyo', type: 'Supermarket', imageUrl: '' });
        setIsEditing(false);
        setCurrentStoreId(null);
        setMessage(null);
    };

    const handleEdit = (store: any) => {
        setFormData({
            name: store.name,
            area: store.area,
            city: store.city, // The model uses 'city' for the state
            type: store.type,
            imageUrl: store.imageUrl || ''
        });
        setCurrentStoreId(store._id);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            const url = '/api/admin/stores';
            const method = isEditing ? 'PUT' : 'POST';
            const body = isEditing ? { ...formData, id: currentStoreId } : formData;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: isEditing ? 'Store updated!' : 'Store created!' });
                if (!isEditing) resetForm();
                fetchData();
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save store.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this store? All linked products will lose their store reference.')) return;

        try {
            const res = await fetch(`/api/admin/stores?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const filteredStores = stores.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             s.area.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesState = filterState === 'All' || s.city === filterState;
        return matchesSearch && matchesState;
    });

    if (loading && stores.length === 0) return <div className="p-10 text-center text-slate-400 font-bold">Loading Store Registry...</div>;

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <nav className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Marketplace</span>
                    </nav>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        Stores & <span className="text-primary italic">Enterprises</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                     <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                        {['All', 'Oyo', 'Lagos'].map(state => (
                            <button
                                key={state}
                                onClick={() => setFilterState(state)}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    filterState === state ? 'bg-primary text-white shadow-glow-sm' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {state}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <Card className="p-8 border-none shadow-premium bg-white sticky top-10">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                {isEditing ? <Edit2 size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
                                {isEditing ? 'Edit Store' : 'Add Store'}
                            </h2>
                            {isEditing && (
                                <button onClick={resetForm} className="text-slate-400 hover:text-rose-500 transition-colors">
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Store Name</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Shoprite, Spano"
                                    required
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">State (City)</label>
                                    <select
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value, area: '' })}
                                        className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="Oyo">Oyo</option>
                                        <option value="Lagos">Lagos</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Official Area</label>
                                    <select
                                        value={formData.area}
                                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                        required
                                        className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="">Select Area</option>
                                        {areasByState[formData.city]?.map(area => (
                                            <option key={area._id} value={area.name}>{area.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Store Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold outline-none"
                                >
                                    <option value="Supermarket">Supermarket</option>
                                    <option value="Market">Traditional Market</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Image URL (Optional)</label>
                                <Input
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>

                            <Button type="submit" className="w-full py-4 text-xs font-black uppercase tracking-widest shadow-glow" disabled={submitting}>
                                {submitting ? 'Processing...' : isEditing ? 'Update Entry' : 'Register Store'}
                            </Button>

                            {message && (
                                <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                    {message.text}
                                </div>
                            )}
                        </form>
                    </Card>
                </div>

                {/* Table Section */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Find an enterprise by name or area..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-100 py-5 pl-16 pr-6 rounded-3xl shadow-premium outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-700 text-sm"
                        />
                    </div>

                    <Card className="p-0 border-none shadow-premium bg-white overflow-hidden rounded-[2rem]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 border-b border-slate-50">
                                    <tr>
                                        <th className="py-6 px-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Store Entity</th>
                                        <th className="py-6 px-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Location</th>
                                        <th className="py-6 px-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Classification</th>
                                        <th className="py-6 px-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStores.map((store) => (
                                        <tr key={store._id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-all group">
                                            <td className="py-6 px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                        {store.imageUrl ? (
                                                            <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Store size={20} className="text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm tracking-tight">{store.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {store._id.slice(-6)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={12} className="text-primary" />
                                                        <span className="text-xs font-black text-slate-700">{store.area}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{store.city}</span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                    store.type === 'Supermarket' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                                    store.type === 'Market' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                    'bg-slate-100 text-slate-600 border border-slate-200'
                                                }`}>
                                                    {store.type}
                                                </span>
                                            </td>
                                            <td className="py-6 px-8 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleEdit(store)}
                                                        className="p-3 rounded-2xl bg-slate-900 text-white hover:bg-primary transition-all shadow-sm"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(store._id)}
                                                        className="p-3 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredStores.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Store size={48} className="text-slate-100" />
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No matching enterprises found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
