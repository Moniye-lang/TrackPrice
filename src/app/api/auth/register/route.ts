import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { hashPassword, signToken } from '@/lib/auth';

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
        const user = new User({
            name: name.trim(),
            email,
            password: hashedPassword,
            role: 'user',
            points: 0,
            reputationLevel: 'Beginner'
        });

        await user.save();

        const token = signToken({ id: user._id, name: user.name, email: user.email, role: user.role });

        const response = NextResponse.json(
            { message: 'Registration successful', role: user.role },
            { status: 201 }
        );

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('[Register API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
