import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Message from '@/models/Message';
import { cleanText } from '@/lib/profanity';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { isServerAdmin, getServerUser } from '@/lib/server-auth';
import { revalidateProducts } from '@/lib/cache';
import Notification from '@/models/Notification';

// Basic in-memory rate limiting
const rateLimit = new Map<string, number>();
const LIMIT_TIME = 30 * 1000; // 30 seconds between posts

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');

        let query: Record<string, any> = {};
        if (productId) {
            // Return messages for a specific product
            query = { productId };
        } else {
            // Return ONLY general forum messages, NOT product-specific ones
            query = { productId: { $exists: false } };
        }

        const messages = await Message.find(query)
            .populate('productId', 'name price maxPrice')
            .populate('userId', 'name')
            .sort({ createdAt: -1 });
        return NextResponse.json(messages);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

import { MessageSchema } from '@/lib/validation';

export async function POST(req: Request) {
    try {
        await connectDB();
        const rawBody = await req.json();
        const body = MessageSchema.parse(rawBody);
        const { content, productId, parentId } = body;

        // Rate limiting logic
        const ip = req.headers.get('x-forwarded-for') || 'anonymous';
        const ipHash = crypto.createHash('md5').update(ip).digest('hex');

        const now = Date.now();
        const lastPost = rateLimit.get(ipHash);
        if (lastPost && now - lastPost < LIMIT_TIME) {
            return NextResponse.json(
                { error: `Please wait ${Math.ceil((LIMIT_TIME - (now - lastPost)) / 1000)}s before posting again.` },
                { status: 429 }
            );
        }

        const cleanedContent = cleanText(content);

        // Check if user is an admin
        const cookieStore = await cookies();
        const anonId = cookieStore.get('anon_id')?.value;
        const isAdmin = await isServerAdmin();
        const currentUser = await getServerUser();

        let replyToContent = undefined;
        let parentMsg = null;
        if (parentId) {
            parentMsg = await Message.findById(parentId);
            if (parentMsg) {
                replyToContent = parentMsg.content.substring(0, 50) + (parentMsg.content.length > 50 ? '...' : '');
            }
        }

        const message = await Message.create({
            content: cleanedContent,
            userId: currentUser?.id || undefined,
            anonId: currentUser ? undefined : anonId,
            productId: productId || undefined,
            ipHash,
            isAdmin,
            parentId: parentId || undefined,
            replyToContent,
        });

        // Trigger Notification if it's a reply
        if (parentMsg) {
            // Don't notify if replying to yourself
            const isSelfReply = (currentUser && parentMsg.userId?.toString() === currentUser.id) || 
                              (anonId && parentMsg.anonId === anonId);
            
            if (!isSelfReply) {
                await Notification.create({
                    recipientUserId: parentMsg.userId,
                    recipientAnonId: parentMsg.anonId,
                    type: 'REPLY',
                    messageId: message._id,
                    targetMessageId: parentMsg._id,
                    productId: productId || undefined,
                    content: `Replied to your comment: "${cleanedContent.substring(0, 30)}..."`,
                    read: false
                });
            }
        }

        rateLimit.set(ipHash, now);

        if (productId) {
            revalidateProducts(productId);
        }

        return NextResponse.json(message, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.errors?.[0]?.message || 'Failed to post message' }, { status: 400 });
    }
}
