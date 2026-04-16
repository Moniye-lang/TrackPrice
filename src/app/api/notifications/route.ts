import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
import { getServerUser } from '@/lib/server-auth';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';

export async function GET(req: Request) {
    try {
        await connectDB();
        
        const user = await getServerUser();
        const cookieStore = await cookies();
        const anonId = cookieStore.get('anon_id')?.value;

        if (!user && !anonId) {
            return NextResponse.json([]); // Not identified at all, return empty array
        }

        let query: Record<string, any> = { read: false };
        
        if (user) {
            query.recipientUserId = new mongoose.Types.ObjectId(user.id);
        } else if (anonId) {
            query.recipientAnonId = anonId;
        }

        const notifications = await Notification.find(query)
            .populate('messageId', 'content')
            .populate('productId', 'name')
            .sort({ createdAt: -1 })
            .limit(20);

        return NextResponse.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { notificationId } = body;

        if (!notificationId) {
            return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
        }

        const user = await getServerUser();
        const cookieStore = await cookies();
        const anonId = cookieStore.get('anon_id')?.value;

        const notification = await Notification.findById(notificationId);
        
        if (!notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        // Verify ownership
        const isOwner = (user && notification.recipientUserId?.toString() === user.id) || 
                        (!user && anonId && notification.recipientAnonId === anonId);

        if (!isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        notification.read = true;
        await notification.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking notification read:', error);
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }
}
