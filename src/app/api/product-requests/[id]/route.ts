import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import ProductRequest from '@/models/ProductRequest';
import User from '@/models/User';
import GamificationRule from '@/models/GamificationRule';
import { isServerAdmin } from '@/lib/server-auth';
import { revalidateLeaderboard } from '@/lib/cache';

async function isAdmin() {
    return await isServerAdmin();
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        if (!status || !['approved', 'denied'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        await connectDB();
        const request = await ProductRequest.findByIdAndUpdate(id, { status }, { new: true });

        if (!request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        // Award points if approved
        if (status === 'approved' && request.userId) {
            let rule = await GamificationRule.findOne();
            if (!rule) rule = await GamificationRule.create({});

            const requester = await User.findById(request.userId);
            if (requester) {
                requester.points += rule.bonusPointsRequest;
                
                // Reputation level checks
                if (requester.points >= 250 && requester.reputationLevel === 'Beginner') {
                    requester.reputationLevel = 'Trusted Contributor';
                } else if (requester.points >= 1000 && requester.reputationLevel === 'Trusted Contributor') {
                    requester.reputationLevel = 'Elite Contributor';
                }
                
                await requester.save();
                revalidateLeaderboard(); // Invalidate leaderboard if someone earned points
            }
        }

        return NextResponse.json({ message: `Request ${status} successfully`, request });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
    }
}
