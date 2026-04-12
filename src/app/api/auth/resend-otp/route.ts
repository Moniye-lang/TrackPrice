import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateOtp, sendOtpEmail } from '@/lib/email-utils';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.isEmailVerified) {
            return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
        }

        // Generate new OTP
        const otp = generateOtp();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        user.emailVerificationOtp = otp;
        user.emailVerificationOtpExpiry = otpExpiry;
        await user.save();

        // Send OTP email
        try {
            await sendOtpEmail(email, otp, 'verification');
        } catch (emailError) {
            console.error('[Resend OTP API] Email send failed:', emailError);
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }

        return NextResponse.json({ message: 'A new verification code has been sent to your email.' });

    } catch (error: any) {
        console.error('[Resend OTP API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
