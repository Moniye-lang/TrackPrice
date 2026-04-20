import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPriceUpdate extends Document {
    productId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    price: number;
    maxPrice?: number;
    storeId?: mongoose.Types.ObjectId;
    storeLocation?: string;
    status: 'pending' | 'verified' | 'rejected';
    marketCategory?: 'Online' | 'Physical';
    confirmations: mongoose.Types.ObjectId[];
    anonymousConfirmations: string[]; // IP hashes or session IDs
    anonId?: string; // Unique ID for guest creators
    createdAt: Date;
    updatedAt: Date;
}

const PriceUpdateSchema: Schema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        anonId: { type: String, index: true }, // Store anon_id for Guest contributions
        price: { type: Number, required: true },
        maxPrice: { type: Number },
        storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
        storeLocation: { type: String },
        marketCategory: { type: String, enum: ['Online', 'Physical'] },
        status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
        confirmations: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        anonymousConfirmations: [{ type: String }],
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
