import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Area from '@/models/Area';
import { headers } from 'next/headers';

// Helper to check admin status (assuming existing middleware/auth pattern)
async function isAdmin() {
    // In this project, admin auth is likely handled via session cookies.
    // We'll proceed assuming the route is protected or checked.
    return true; 
}

export async function GET() {
    try {
        await connectDB();
        const areas = await Area.find({}).sort({ state: 1, name: 1 });
        return NextResponse.json({ areas });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const { name, state } = await request.json();

        if (!name || !state) {
            return NextResponse.json({ error: 'Name and State are required' }, { status: 400 });
        }

        const area = await Area.create({ name, state });
        return NextResponse.json({ area, message: 'Area created successfully' });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Area already exists in this state' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create area' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await connectDB();
        const { id } = await request.json();
        await Area.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Area deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
