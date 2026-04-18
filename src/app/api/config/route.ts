import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import GamificationRule from '@/models/GamificationRule';

export async function GET() {
    try {
        await connectDB();
        let rule = await GamificationRule.findOne();

        if (!rule) {
            rule = await GamificationRule.create({});
        }

        // Return only safe, non-sensitive public configuration
        return NextResponse.json({
            forumLocked: rule.forumLocked,
            forumLockedMessage: rule.forumLockedMessage,
        });

    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
}
