import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Notification from '@/models/Notification';
import Message from '@/models/Message';
import PriceUpdate from '@/models/PriceUpdate';
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

        if (name && name !== user.name) {
            const existing = await User.findOne({ name: name.trim() });
            if (existing) return NextResponse.json({ error: 'Display name already taken' }, { status: 400 });
            user.name = name.trim();
        }
        if (city !== undefined) user.city = city;

        await user.save();

        return NextResponse.json({ message: 'Profile updated', user: { name: user.name, city: user.city } });
    } catch (error: any) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const userPayload = await getServerUser();
    if (!userPayload || !userPayload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await connectDB();
        const userId = userPayload.id;

        // Cascade cleanup:
        // 1. Delete notifications (private to user)
        await Notification.deleteMany({ recipientUserId: userId });

        // 2. Anonymize forum messages (preserve thread context)
        await Message.updateMany({ userId: userId }, { $set: { userId: null } });

        // 3. Anonymize price suggestions (preserve price history)
        await PriceUpdate.updateMany({ userId: userId }, { $set: { userId: null } });

        // 4. Finally delete the user
        await User.findByIdAndDelete(userId);

        const response = NextResponse.json({ message: 'Account deleted' });
        
        response.cookies.set('admin_token', '', { expires: new Date(0), path: '/' });
        response.cookies.set('user_token', '', { expires: new Date(0), path: '/' });
        response.cookies.set('token', '', { expires: new Date(0), path: '/' });

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
    }
}
