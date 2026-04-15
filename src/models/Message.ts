import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
    content: string;
    userId?: mongoose.Types.ObjectId;
    anonId?: string;
    productId?: string;
    ipHash?: string;
    isEdited?: boolean;
    isAdmin: boolean;
    parentId?: string;
    replyToContent?: string;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
    {
        content: { type: String, required: true, maxlength: 300 },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
        anonId: { type: String, required: false, index: true },
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: false },
        ipHash: { type: String, required: false },
        isEdited: { type: Boolean, default: false },
        isAdmin: { type: Boolean, default: false },
        parentId: { type: Schema.Types.ObjectId, ref: 'Message', required: false },
        replyToContent: { type: String, required: false },
    },
    {
        timestamps: true,
    }
);

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
