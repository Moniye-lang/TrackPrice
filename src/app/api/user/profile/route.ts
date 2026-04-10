import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getServerUser } from '@/lib/server-auth';

export async function PUT(req: Request) {
    const userPayload = await getServerUser();
    if (!userPayload || !userPayload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await connectDB();
        const body = await req.json();
        const { name, city } = body;

        const user = await User.findById(userPayload.id);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (name) user.name = name;
        if (city !== undefined) user.city = city;

        await user.save();

        return NextResponse.json({ message: 'Profile updated', user: { name: user.name, city: user.city } });
    } catch (error: any) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
