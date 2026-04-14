'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui-base';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    points: number;
    reputationLevel: string;
    isBanned: boolean;
    totalSubmissions: number;
    createdAt: string;
    isAnonymous?: boolean;
}

import { 
    Users, 
    Search, 
    Shield, 
    ShieldAlert, 
    ShieldCheck, 
    Award, 
    TrendingUp, 
    Mail, 
    Calendar, 
    MoreVertical,
    Ban,
    Unlock,
    UserPlus,
    RefreshCw,
    Circle,
    UserCircle2,
    Box,
    Fingerprint,
    Activity
} from 'lucide-react';

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUpdateUser = async (id: string, updates: Partial<User>) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (res.ok) {
                setUsers(prev => prev.map(u => u._id === id ? { ...u, ...updates } : u));
            } else {
                alert('Failed to update user');
            }
        } catch (error) {
            console.error('Failed to update user', error);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                     <nav className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Community</span>
                    </nav>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        Member <span className="text-primary italic">Directory</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={fetchUsers} 
                        variant="secondary"
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 px-6 py-3 rounded-2xl transition-all"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sync Database</span>
                    </Button>
                </div>
            </div>

            {/* Search & Stats Bar */}
            <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="relative group flex-1 w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search operators by name or verified email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-100 py-5 pl-16 pr-6 rounded-3xl shadow-premium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all font-bold text-slate-700 text-sm placeholder:text-slate-300"
                    />
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-3xl shadow-premium border border-slate-50/50">
                    <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{users.filter(u => !u.isBanned).length} Active</span>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-3 bg-rose-50 rounded-2xl border border-rose-100/50">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{users.filter(u => u.isBanned).length} Restricted</span>
                    </div>
                </div>
            </div>

            {loading ? (
                 <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="animate-pulse flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Member Registry</p>
                </div>
            ) : (
                <Card className="p-0 border-none shadow-premium bg-white overflow-hidden rounded-[2.5rem]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 border-b border-slate-50">
                                <tr>
                                    <th className="py-6 px-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Operator Identity</th>
                                    <th className="py-6 px-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Merit & Activity</th>
                                    <th className="py-6 px-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Authentication</th>
                                    <th className="py-6 px-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Directives</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className={`border-b border-slate-50 group transition-all ${user.isBanned ? 'bg-rose-50/10' : 'hover:bg-slate-50/30'}`}>
                                        <td className="py-6 px-8">
                                            <div className="flex items-center gap-5">
                                                <div className="relative">
                                                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-sm border-2 transition-transform group-hover:scale-105 duration-500 ${
                                                        user.role === 'admin' 
                                                        ? 'bg-primary/10 border-primary/20 text-primary' 
                                                        : user.isAnonymous
                                                        ? 'bg-slate-900 border-slate-700 text-slate-500'
                                                        : 'bg-slate-100 border-slate-200 text-slate-400'
                                                    }`}>
                                                        {user.isAnonymous ? (
                                                            <div className="opacity-40"><Shield size={20} /></div>
                                                        ) : (
                                                            user.name?.charAt(0).toUpperCase() || '?'
                                                        )}
                                                    </div>
                                                    {!user.isAnonymous && (
                                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center ${user.isBanned ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                                                            {user.isBanned ? <Ban size={8} className="text-white" /> : <ShieldCheck size={8} className="text-white" />}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm tracking-tight leading-tight mb-1">
                                                        {user.isAnonymous ? 'Anonymous Operator' : user.name}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        {user.isAnonymous ? <Fingerprint size={10} className="text-primary/60" /> : <Mail size={10} className="text-slate-300" />}
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-6 px-8">
                                            <div className="flex items-center gap-8">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <TrendingUp size={12} className="text-primary" />
                                                        <span className="text-sm font-black text-slate-900 tracking-tight">{user.points || 0}</span>
                                                    </div>
                                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Merit Points</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <Box size={12} className={user.isAnonymous ? 'text-primary' : 'text-slate-400'} />
                                                        <span className="text-sm font-black text-slate-900 tracking-tight font-mono">{user.totalSubmissions || 0}</span>
                                                    </div>
                                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Updates</span>
                                                </div>
                                                {!user.isAnonymous && (
                                                    <div className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-sm ${
                                                        user.reputationLevel === 'Elite Contributor' ? 'bg-amber-100 text-amber-700 border border-amber-200/50' :
                                                        user.reputationLevel === 'Trusted Contributor' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200/50' :
                                                        'bg-slate-100 text-slate-600 border border-slate-200/50'
                                                    }`}>
                                                        {user.reputationLevel}
                                                    </div>
                                                )}
                                                {user.isAnonymous && (
                                                    <div className="px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest bg-slate-950 text-slate-500 border border-white/5">
                                                        Guest Identity
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td className="py-6 px-8">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    {user.role === 'admin' ? (
                                                        <Shield size={14} className="text-primary" />
                                                    ) : user.isAnonymous ? (
                                                        <Activity size={14} className="text-slate-500" />
                                                    ) : (
                                                        <UserCircle2 size={14} className="text-slate-400" />
                                                    )}
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                        user.role === 'admin' ? 'text-primary' : user.isAnonymous ? 'text-slate-500' : 'text-slate-600'
                                                    }`}>
                                                        {user.role} Authorization
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={10} className="text-slate-300" />
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {user.isAnonymous ? 'Active Since ' : 'Reg '} {new Date(user.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-6 px-8 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                <button 
                                                    onClick={() => {
                                                        const newPoints = prompt(`Adjust Merit Points for ${user.name}:`, user.points.toString());
                                                        if (newPoints && !isNaN(Number(newPoints))) {
                                                            handleUpdateUser(user._id, { points: Number(newPoints) });
                                                        }
                                                    }}
                                                    className="p-3 rounded-2xl bg-slate-900 text-white hover:bg-primary transition-all shadow-sm"
                                                    title="Adjust Merit"
                                                >
                                                    <Award size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        const levels = ['Beginner', 'Trusted Contributor', 'Elite Contributor'];
                                                        const currentIdx = levels.indexOf(user.reputationLevel);
                                                        const nextIdx = (currentIdx + 1) % levels.length;
                                                        handleUpdateUser(user._id, { reputationLevel: levels[nextIdx] });
                                                    }}
                                                    className="p-3 rounded-2xl bg-slate-900 text-white hover:bg-primary transition-all shadow-sm"
                                                    title="Promote Member"
                                                >
                                                    <TrendingUp size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        const newRole = user.role === 'admin' ? 'user' : 'admin';
                                                        if (confirm(`Elevate ${user.name} to System ${newRole.toUpperCase()}?`)) {
                                                            handleUpdateUser(user._id, { role: newRole });
                                                        }
                                                    }}
                                                    className="p-3 rounded-2xl bg-slate-900 text-white hover:bg-primary transition-all shadow-sm"
                                                    title="Toggle Permissions"
                                                >
                                                    <Shield size={16} />
                                                </button>
                                                {user.isBanned ? (
                                                    <button 
                                                        onClick={() => handleUpdateUser(user._id, { isBanned: false })}
                                                        className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                        title="Restore Access"
                                                    >
                                                        <Unlock size={16} />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => {
                                                            if (confirm(`Restrict access for ${user.name}?`)) {
                                                                handleUpdateUser(user._id, { isBanned: true });
                                                            }
                                                        }}
                                                        className="p-3 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                        title="Revoke Access"
                                                    >
                                                        <Ban size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Users size={40} className="text-slate-100" />
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No matching operators found</p>
                                                <Button 
                                                    variant="secondary" 
                                                    onClick={() => setSearchTerm('')}
                                                    className="mt-2 text-[8px] font-black uppercase underline decoration-primary decoration-2 underline-offset-4"
                                                >
                                                    Reset Registry Filter
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
