'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui-base';
import Link from 'next/link';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/');
                router.refresh();
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-mesh px-4">
            <Card className="w-full max-w-md p-8 backdrop-blur-xl bg-white/70 border border-white/50 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Join TrackPrice</h1>
                    <p className="text-slate-500 font-medium mt-2">Become a contributor and earn rewards.</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Email Address
                        </label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Password
                        </label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            minLength={6}
                            required
                        />
                    </div>
                    {error && (
                        <p className="text-rose-500 text-sm font-medium bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</p>
                    )}
                    <Button type="submit" disabled={loading} className="w-full shadow-glow py-4 text-lg">
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm font-medium text-slate-500">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary hover:underline font-bold">
                        Log in
                    </Link>
                </div>
            </Card>
        </div>
    );
}
