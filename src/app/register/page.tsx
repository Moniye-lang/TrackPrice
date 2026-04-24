'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui-base';
import Link from 'next/link';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function RegisterPage() {
    const [name, setName] = useState('');
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
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (res.status === 201 || data.verificationRequired) {
                // Redirect to verify email page
                const emailParam = encodeURIComponent(email || data.email);
                router.push(`/verify-email?email=${emailParam}`);
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

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential }),
            });
            const data = await res.json();
            if (res.ok) {
                router.push('/register/onboarding');
                router.refresh();
            } else {
                setError(data.error || 'Google login failed');
            }
        } catch (err) {
            setError('An error occurred during Google sign-in.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-mesh px-4 py-12">
            <Card className="w-full max-w-md p-8 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/50 dark:border-slate-800 shadow-2xl">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Join TrackPricely</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Create an account to start contributing real-time price updates.</p>
                </div>

                <div className="flex justify-center mb-6">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Sign up was unsuccessful')}
                        useOneTap
                        text="signup_with"
                        theme="filled_black"
                        shape="pill"
                    />
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">Or continue with</span>
                    </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Full Name
                        </label>
                        <Input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
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
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
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
                        <p className="text-rose-500 dark:text-rose-400 text-sm font-medium bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40">{error}</p>
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
