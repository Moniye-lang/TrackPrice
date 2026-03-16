import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { comparePassword, signToken, hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { email, password } = await req.json();

        console.log(`[Login] Attempt for ${email}`);

        // Special check for initial setup
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@trackprice.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        let user = await User.findOne({ email });

        if (!user && email === adminEmail && password === adminPassword) {
            console.log('[Login] Creating initial admin...');
            const hashedPassword = await hashPassword(adminPassword);
            user = await User.create({
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
            });
            console.log('[Login] Admin created successfully');
        }

        if (!user) {
            console.log('[Login] User not found:', email);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isMatch = await comparePassword(password, user.password);

        // If it's the admin and password doesn't match, check if it matches the current ADMIN_PASSWORD env
        // This allows updating admin password via .env.local
        if (!isMatch && email === adminEmail && password === adminPassword) {
            console.log('[Login] Admin password update detected. Updating DB...');
            const hashedPassword = await hashPassword(adminPassword);
            user.password = hashedPassword;
            await user.save();
            console.log('[Login] Admin password updated');
        } else if (!isMatch) {
            console.log('[Login] Password mismatch for:', email);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = signToken({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });

        const response = NextResponse.json({ message: 'Login successful' });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        console.log('[Login] Successful for:', email);
        return response;
    } catch (error) {
        console.error('[Login] error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
