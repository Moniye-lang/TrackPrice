'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui-base';
import Link from 'next/link';
import { Mail, CheckCircle, RefreshCcw, ArrowLeft, ShieldCheck } from 'lucide-react';

function VerifyEmailForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        const e = searchParams.get('email');
        if (e) setEmail(e);
    }, [searchParams]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit code.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess('Email verified successfully! Redirecting...');
                setTimeout(() => {
                    router.push('/');
                    router.refresh();
                }, 2000);
            } else {
                setError(data.error || 'Verification failed. Please check the code.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            setError('Email address is missing.');
            return;
        }

        setResending(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/auth/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess('A new code has been sent to your email.');
            } else {
                setError(data.error || 'Failed to resend code.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setResending(false);
        }
    };

    return (
        <Card className="w-full max-w-md p-8 backdrop-blur-xl bg-white/70 border border-white/50 shadow-2xl relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />

            <div className="relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-glow-sm">
                        <ShieldCheck size={32} />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Verify Email</h1>
                    <p className="text-slate-500 font-medium mt-2">
                        Enter the 6-digit code sent to <span className="font-bold text-slate-700 underline decoration-primary/30">{email || 'your email'}</span>
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                    <div>
                        <Input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            placeholder="000 000"
                            className="text-center text-3xl font-black tracking-[0.5em] h-16 bg-white/50 border-slate-200 focus:border-primary focus:ring-primary/20 transition-all"
                            required
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 animate-in fade-in slide-in-from-top-1">
                            <RefreshCcw size={16} className="flex-shrink-0" />
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 animate-in fade-in slide-in-from-top-1">
                            <CheckCircle size={16} className="flex-shrink-0" />
                            <p className="text-sm font-bold">{success}</p>
                        </div>
                    )}

                    <Button type="submit" disabled={loading || otp.length !== 6} className="w-full shadow-glow py-4 text-lg font-black tracking-wide h-14 rounded-xl">
                        {loading ? 'Verifying...' : 'Complete Verification'}
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                    <div className="text-center">
                        <p className="text-sm font-medium text-slate-400">
                            Didn't receive the code?
                        </p>
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="mt-1 text-primary hover:text-primary/80 font-black text-sm uppercase tracking-widest flex items-center gap-2 mx-auto transition-colors disabled:opacity-50"
                        >
                            <RefreshCcw size={14} className={resending ? 'animate-spin' : ''} />
                            {resending ? 'Sending...' : 'Resend Code'}
                        </button>
                    </div>

                    <div className="text-center">
                        <Link href="/register" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                            <ArrowLeft size={12} />
                            Back to Register
                        </Link>
                    </div>
                </div>
            </div>
        </Card>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-mesh px-4 py-12">
            <Suspense fallback={
                <Card className="w-full max-w-md p-8 animate-pulse bg-white/50 border border-white/20 h-96">
                    <div className="h-full w-full" />
                </Card>
            }>
                <VerifyEmailForm />
            </Suspense>
        </div>
    );
}
