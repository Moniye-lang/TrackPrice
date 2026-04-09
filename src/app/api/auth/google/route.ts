import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
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
            // Create a new user for Google Sign-In
            // Provide a random password since they logged in via Google
            const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
            
            user = new User({
                name,
                email,
                password: randomPassword, // won't be used
                googleId,
            });
            await user.save();
        } else if (!user.googleId) {
            // Link google account to existing email
            user.googleId = googleId;
            await user.save();
        }

        // Generate JWT locally
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '7d' }
        );

        const response = NextResponse.json({ 
            message: 'Login successful', 
            user: { id: user._id, name: user.name, role: user.role } 
        }, { status: 200 });
        
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Google Auth Error:', error);
        return NextResponse.json({ error: 'Google sign-in failed' }, { status: 500 });
    }
}
