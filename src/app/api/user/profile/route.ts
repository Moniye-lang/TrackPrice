import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function PUT(req: Request) {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload: any = verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Auth failed' }, { status: 401 });

    try {
        await connectDB();
        const body = await req.json();
        const { name, city } = body;

        const user = await User.findById(payload.id);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (name) user.name = name;
        if (city !== undefined) user.city = city;

        await user.save();

        return NextResponse.json({ message: 'Profile updated', user: { name: user.name, city: user.city } });
    } catch (error: any) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
