import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { hashPassword, signToken } from '@/lib/auth';
import { generateOtp, sendOtpEmail } from '@/lib/email-utils';

// JWT secret is handled in @/lib/auth

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || name.trim().length < 2) {
            return NextResponse.json({ error: 'A display name (at least 2 characters) is required.' }, { status: 400 });
        }
        if (!email || !password || password.length < 6) {
            return NextResponse.json({ error: 'Valid email and password (min 6 characters) are required.' }, { status: 400 });
        }

        await connectDB();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'Email already in use.' }, { status: 400 });
        }

        // Add regular user role
        const hashedPassword = await hashPassword(password);
        
        // OTP Generation
        const otp = generateOtp();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        const user = new User({
            name: name.trim(),
            email,
            password: hashedPassword,
            role: 'user',
            points: 0,
            reputationLevel: 'Beginner',
            isEmailVerified: false,
            emailVerificationOtp: otp,
            emailVerificationOtpExpiry: otpExpiry
        });

        await user.save();

        // Send OTP email
        try {
            await sendOtpEmail(email, otp, 'verification');
        } catch (emailError) {
            console.error('[Register API] Email send failed:', emailError);
            // We still proceed since the user is created; they can resend later
        }

        return NextResponse.json(
            { 
                message: 'Registration successful. Please verify your email.', 
                email: user.email,
                verificationRequired: true 
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('[Register API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
