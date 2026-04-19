import { formatDistanceToNow } from 'date-fns';

export function formatRelativeTime(date: Date | string) {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * WhatsApp-style timestamp:
 * - Today     → "14:32"
 * - Yesterday → "Yesterday 14:32"
 * - Older     → "18 Apr 14:32"
 */
export function formatTimestamp(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yestMidnight = new Date(todayMidnight.getTime() - 86400000);

    if (d >= todayMidnight) return time;
    if (d >= yestMidnight) return `Yesterday ${time}`;
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ' ' + time;
}

export function escapeRegex(text: string) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
