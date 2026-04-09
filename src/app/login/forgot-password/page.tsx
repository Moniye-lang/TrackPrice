'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui-base';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    
    // Step 1
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    
    // Step 2
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetting, setResetting] = useState(false);
    
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setError('');
        
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            
            if (res.ok) {
                setSuccessMessage('OTP sent to your email.');
                setStep(2);
            } else {
                setError(data.error || 'Failed to send OTP.');
            }
        } catch (error) {
            setError('An error occurred while connecting to the server.');
        } finally {
            setSending(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetting(true);
        setError('');
        
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword })
            });
            const data = await res.json();
            
            if (res.ok) {
                setSuccessMessage('Password reset successfully!');
                setTimeout(() => router.push('/login'), 2000);
            } else {
                setError(data.error || 'Failed to reset password.');
            }
        } catch (error) {
            setError('An error occurred.');
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-mesh px-4">
            <Card className="w-full max-w-md p-8 backdrop-blur-xl bg-white/70 border border-white/50 shadow-2xl relative overflow-hidden">
                <div className="text-center mb-8 relative z-10">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reset Password</h1>
                    <p className="text-slate-500 font-medium mt-2">
                        {step === 1 ? "Enter your email to receive a recovery code." : "Enter the 6-digit code sent to your email."}
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 font-bold text-sm rounded-xl mb-6 text-center">
                        {error}
                    </div>
                )}
                
                {successMessage && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold text-sm rounded-xl mb-6 text-center">
                        {successMessage}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleSendOtp} className="space-y-5 relative z-10">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Registered Email</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full py-4 font-black shadow-glow uppercase tracking-widest text-xs" disabled={sending}>
                            {sending ? 'Sending...' : 'Send OTP'}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-5 relative z-10">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">OTP Code</label>
                            <Input
                                type="text"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="123456"
                                className="text-center text-2xl tracking-[0.5em] font-black placeholder:text-slate-300 placeholder:tracking-normal"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                        <Button type="submit" className="w-full py-4 font-black shadow-glow uppercase tracking-widest text-xs bg-emerald-500 hover:bg-emerald-600" disabled={resetting}>
                            {resetting ? 'Resetting...' : 'Reset Password'}
                        </Button>
                        <div className="text-center mt-2">
                             <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-slate-400 hover:text-primary">
                                 Wrong email? Go back.
                             </button>
                        </div>
                    </form>
                )}

                <div className="mt-8 text-center text-sm font-medium text-slate-500 relative z-10">
                    Remebered your password? {' '}
                    <Link href="/login" className="text-primary hover:underline font-bold">
                        Back to Login
                    </Link>
                </div>
            </Card>
        </div>
    );
}
