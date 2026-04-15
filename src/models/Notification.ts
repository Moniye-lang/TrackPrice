import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
    recipientUserId?: mongoose.Types.ObjectId; // For registered users
    recipientAnonId?: string; // For guest users
    type: 'REPLY' | 'SYSTEM' | 'PRICE_VERIFIED';
    messageId?: mongoose.Types.ObjectId; // The reply message or relevant message
    targetMessageId?: mongoose.Types.ObjectId; // The original message being replied to
    productId?: mongoose.Types.ObjectId; // Relevant product if any
    content?: string; // Preview or system message
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
    {
        recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
        recipientAnonId: { type: String, required: false, index: true },
        type: { 
            type: String, 
            enum: ['REPLY', 'SYSTEM', 'PRICE_VERIFIED'], 
            default: 'REPLY' 
        },
        messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: false },
        targetMessageId: { type: Schema.Types.ObjectId, ref: 'Message', required: false },
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: false },
        content: { type: String, required: false },
        read: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

// Auto-expire read notifications after 30 days (User agreed to keep DB lean)
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days in seconds

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
