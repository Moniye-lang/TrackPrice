import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

async function getAdminFromToken() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch {
        return null;
    }
}

// PUT to update a specific user (Admin ONLY)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const decodedToken = await getAdminFromToken();
        if (!decodedToken || typeof decodedToken.id !== 'string') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const adminUser = await User.findById(decodedToken.id);

        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const oldState = {
            points: targetUser.points,
            reputationLevel: targetUser.reputationLevel,
            isBanned: targetUser.isBanned
        };

        if (body.points !== undefined) targetUser.points = body.points;
        if (body.reputationLevel !== undefined) targetUser.reputationLevel = body.reputationLevel;
        if (body.isBanned !== undefined) targetUser.isBanned = body.isBanned;

        await targetUser.save();

        // Log the action
        await AuditLog.create({
            adminId: adminUser._id,
            action: 'MODERATED_USER',
            details: {
                targetUserId: targetUser._id,
                targetUserEmail: targetUser.email,
                old: oldState,
                new: {
                    points: targetUser.points,
                    reputationLevel: targetUser.reputationLevel,
                    isBanned: targetUser.isBanned
                }
            }
        });

        // Don't send back the password
        const { password, ...returnUser } = targetUser.toObject();

        return NextResponse.json({ message: 'User updated successfully', user: returnUser });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
