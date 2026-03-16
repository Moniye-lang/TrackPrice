import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import GamificationRule from '@/models/GamificationRule';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';

async function getAdminFromToken() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;
    try {
        return verifyToken(token);
    } catch {
        return null;
    }
}

// GET current gamification rules
export async function GET() {
    try {
        await connectDB();
        let rule = await GamificationRule.findOne();

        // Ensure at least one explicit rule set exists
        if (!rule) {
            rule = await GamificationRule.create({});
        }

        return NextResponse.json(rule);

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// PUT to update gamification rules (Admin ONLY)
export async function PUT(req: Request) {
    try {
        const decodedToken = await getAdminFromToken();
        if (!decodedToken || typeof (decodedToken as any).id !== 'string') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const adminUser = await User.findById((decodedToken as any).id);

        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        const body = await req.json();

        let rule = await GamificationRule.findOne();
        if (!rule) {
            rule = new GamificationRule();
        }

        const oldRules = rule.toObject();

        if (body.pointsPerUpdate !== undefined) rule.pointsPerUpdate = body.pointsPerUpdate;
        if (body.bonusPointsRequest !== undefined) rule.bonusPointsRequest = body.bonusPointsRequest;
        if (body.dailyUpdateLimit !== undefined) rule.dailyUpdateLimit = body.dailyUpdateLimit;
        if (body.verificationThreshold !== undefined) rule.verificationThreshold = body.verificationThreshold;

        await rule.save();

        // Log the action
        await AuditLog.create({
            adminId: adminUser._id,
            action: 'UPDATED_GAMIFICATION_RULES',
            details: {
                old: oldRules,
                new: rule.toObject()
            }
        });

        return NextResponse.json({ message: 'Rules updated successfully', rule });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
