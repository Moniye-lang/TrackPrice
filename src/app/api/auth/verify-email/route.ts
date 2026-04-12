import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.isEmailVerified) {
            return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
        }

        if (user.emailVerificationOtp !== otp) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        if (user.emailVerificationOtpExpiry && user.emailVerificationOtpExpiry < new Date()) {
            return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
        }

        // Mark as verified
        user.isEmailVerified = true;
        user.emailVerificationOtp = undefined;
        user.emailVerificationOtpExpiry = undefined;
        await user.save();

        // Sign token and log in
        const token = signToken({ 
            id: user._id, 
            name: user.name, 
            email: user.email, 
            role: user.role 
        });

        const response = NextResponse.json({ 
            message: 'Email verified successfully. You are now logged in.',
            user: { id: user._id, name: user.name, role: user.role }
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return response;

    } catch (error: any) {
        console.error('[Verify Email API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
