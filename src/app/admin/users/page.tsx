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
}

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // store user ID being acted on

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

    const handleUpdateUser = async (id: string, updates: Partial<User>) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (res.ok) {
                // Update local state directly instead of refetching everything to save time
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manage Users</h1>
                <Button onClick={fetchUsers} variant="secondary">Refresh Data</Button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-500">Loading users...</div>
            ) : (
                <Card className="overflow-x-auto p-0 border-none shadow-premium">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">User</th>
                                <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Stats</th>
                                <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id} className={`border-b border-slate-50 transition-colors ${user.isBanned ? 'bg-rose-50/50' : 'hover:bg-slate-50/50'}`}>
                                    <td className="py-4 px-6">
                                        <div className="font-bold text-slate-800">{user.name}</div>
                                        <div className="text-sm font-medium text-slate-500">{user.email}</div>
                                        <div className="text-[10px] font-black uppercase tracking-widest mt-1 text-slate-400">
                                            Role: {user.role} | Joined {new Date(user.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>

                                    <td className="py-4 px-6">
                                        <div className="flex gap-4">
                                            <div className="text-center">
                                                <div className="text-lg font-black text-primary">{user.points}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Points</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-lg font-black text-slate-700">{user.totalSubmissions || 0}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Updates</div>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${user.reputationLevel === 'Elite Contributor' ? 'bg-amber-100 text-amber-700' :
                                                    user.reputationLevel === 'Trusted Contributor' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {user.reputationLevel}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="py-4 px-6">
                                        {user.isBanned ? (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-100 text-rose-700 text-xs font-black uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                                Banned
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                Active
                                            </span>
                                        )}
                                    </td>

                                    <td className="py-4 px-6 text-right space-y-2">
                                        <div className="flex justify-end gap-2">
                                            {/* Penalty / Reward Points */}
                                            <Button
                                                variant="secondary"
                                                className="px-3 py-1 text-[10px] font-bold"
                                                disabled={actionLoading === user._id || user.role === 'admin'}
                                                onClick={() => {
                                                    const newPoints = prompt(`Enter new points for ${user.name}:`, user.points.toString());
                                                    if (newPoints && !isNaN(Number(newPoints))) {
                                                        handleUpdateUser(user._id, { points: Number(newPoints) });
                                                    }
                                                }}
                                            >
                                                Adjust Points
                                            </Button>

                                            {/* Ban / Unban */}
                                            {user.isBanned ? (
                                                <Button
                                                    variant="secondary"
                                                    className="px-3 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                                                    disabled={actionLoading === user._id}
                                                    onClick={() => handleUpdateUser(user._id, { isBanned: false })}
                                                >
                                                    {actionLoading === user._id ? 'Working...' : 'Unban'}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="danger"
                                                    className="px-3 py-1 text-[10px] font-bold"
                                                    disabled={actionLoading === user._id || user.role === 'admin'}
                                                    onClick={() => {
                                                        if (confirm(`Are you sure you want to ban ${user.name}? They will lose the ability to submit price updates.`)) {
                                                            handleUpdateUser(user._id, { isBanned: true });
                                                        }
                                                    }}
                                                >
                                                    {actionLoading === user._id ? 'Working...' : 'Ban User'}
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
}
