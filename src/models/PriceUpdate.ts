import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPriceUpdate extends Document {
    productId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    price: number;
    status: 'pending' | 'verified' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const PriceUpdateSchema: Schema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        price: { type: Number, required: true },
        status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    },
    {
        timestamps: true,
    }
);

PriceUpdateSchema.index({ productId: 1, userId: 1, createdAt: -1 });

const PriceUpdate: Model<IPriceUpdate> = mongoose.models.PriceUpdate || mongoose.model<IPriceUpdate>('PriceUpdate', PriceUpdateSchema);

export default PriceUpdate;
