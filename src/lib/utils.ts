import { formatDistanceToNow } from 'date-fns';
import mongoose from 'mongoose';

export function formatRelativeTime(date: Date | string) {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function escapeRegex(text: string) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export function isValidObjectId(id: string) {
    return mongoose.Types.ObjectId.isValid(id);
}
