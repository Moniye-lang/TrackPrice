import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPriceUpdate extends Document {
    productId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    price: number;
    storeLocation?: string;
    status: 'pending' | 'verified' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const PriceUpdateSchema: Schema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        price: { type: Number, required: true },
        storeLocation: { type: String },
        status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    },
    {
        timestamps: true,
    }
);

PriceUpdateSchema.index({ productId: 1, userId: 1, createdAt: -1 });

// Force clear Next.js cached model instance so the updated schema rules apply
if (mongoose.models.PriceUpdate) {
    delete mongoose.models.PriceUpdate;
}
const PriceUpdate: Model<IPriceUpdate> = mongoose.model<IPriceUpdate>('PriceUpdate', PriceUpdateSchema);

export default PriceUpdate;
