import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
    content: string;
    productId?: string;
    ipHash?: string;
    isAdmin: boolean;
    parentId?: string;
    replyToContent?: string;
    createdAt: Date;
}

const MessageSchema: Schema = new Schema(
    {
        content: { type: String, required: true, maxlength: 300 },
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: false },
        ipHash: { type: String, required: false },
        isAdmin: { type: Boolean, default: false },
        parentId: { type: Schema.Types.ObjectId, ref: 'Message', required: false },
        replyToContent: { type: String, required: false },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
