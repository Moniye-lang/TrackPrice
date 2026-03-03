import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { comparePassword, signToken, hashPassword } from '@/lib/auth';
import { serialize } from 'cookie';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { email, password } = await req.json();

        // Special check for initial setup
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@trackprice.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        let user = await User.findOne({ email });

        if (!user && email === adminEmail && password === adminPassword) {
            // Auto-create initial admin
            const hashedPassword = await hashPassword(adminPassword);
            user = await User.create({
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
            });
        }

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = signToken({ id: user._id, role: user.role });

        const cookie = serialize('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return NextResponse.json(
            { message: 'Login successful' },
            {
                status: 200,
                headers: { 'Set-Cookie': cookie },
            }
        );
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
