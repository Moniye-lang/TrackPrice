import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { credential } = await req.json();

        if (!credential) {
            return NextResponse.json({ error: 'Missing credential' }, { status: 400 });
        }

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: clientId,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            return NextResponse.json({ error: 'Invalid Google Token' }, { status: 401 });
        }

        const { email, name, sub: googleId } = payload;

        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
            // Create a new verified user for Google Sign-In
            // Provide a random password since they logged in via Google
            const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
            
            user = new User({
                name,
                email,
                password: randomPassword, // won't be used
                googleId,
                isEmailVerified: true, // Google verifies emails
            });
            await user.save();
        } else {
            // Update existing user if needed
            let updated = false;
            if (!user.googleId) {
                user.googleId = googleId;
                updated = true;
            }
            if (!user.isEmailVerified) {
                user.isEmailVerified = true;
                updated = true;
            }
            if (updated) await user.save();
        }

        // Generate JWT locally using standardized utility
        const token = signToken({ 
            id: user._id, 
            email: user.email, 
            role: user.role, 
            name: user.name 
        });

        const response = NextResponse.json({ 
            message: 'Login successful', 
            user: { id: user._id, name: user.name, role: user.role } 
        }, { status: 200 });
        
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 1 day (standardized)
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Google Auth Error:', error);
        return NextResponse.json({ error: 'Google sign-in failed' }, { status: 500 });
    }
}
