import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { sendOtpEmail } from '@/lib/email-utils';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Return success even if user not found to prevent email enumeration
            return NextResponse.json({ message: 'If that email exists, an OTP has been sent.' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        // Save OTP
        user.resetOtp = otp;
        user.resetOtpExpiry = otpExpiry;
        await user.save();

        // Send OTP email
        try {
            await sendOtpEmail(email, otp, 'reset');
        } catch (emailError) {
            console.error('Forgot password email failed:', emailError);
        }

        return NextResponse.json({ message: 'If that email exists, an OTP has been sent.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
