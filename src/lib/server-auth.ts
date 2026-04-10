import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export interface UserPayload {
    id: string;
    email: string;
    role: string;
    name: string;
}

/**
 * Gets the current authenticated user from either admin_token or user_token
 */
export async function getServerUser(): Promise<UserPayload | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_token')?.value || cookieStore.get('user_token')?.value || cookieStore.get('token')?.value;
        
        if (!token) return null;

        const payload = verifyToken(token) as any;
        if (!payload) return null;
        
        // Safety cast for the expected payload structure
        return {
            id: (payload.id as string) || (payload.userId as string),
            email: payload.email as string,
            role: payload.role as string,
            name: payload.name as string
        };
    } catch (error) {
        console.error('[getServerUser] Error:', error);
        return null;
    }
}

/**
 * Checks if the current requester has an admin role
 */
export async function isServerAdmin(): Promise<boolean> {
    const user = await getServerUser();
    return user?.role === 'admin';
}
