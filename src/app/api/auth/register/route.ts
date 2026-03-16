import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import * as bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

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
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name: name.trim(),
            email,
            password: hashedPassword,
            role: 'user',
            points: 0,
            reputationLevel: 'Beginner'
        });

        await user.save();

        const token = await new SignJWT({ id: user._id, name: user.name, email: user.email, role: user.role })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(JWT_SECRET);

        const response = NextResponse.json({ message: 'Registration successful', role: user.role });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60, // 24 hours
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('[Register API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
