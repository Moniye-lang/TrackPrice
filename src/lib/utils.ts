import { formatDistanceToNow } from 'date-fns';

export function formatRelativeTime(date: Date | string) {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
}
