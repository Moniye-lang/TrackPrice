import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPriceRequest extends Document {
    productId: mongoose.Types.ObjectId;
    requesterId: mongoose.Types.ObjectId;
    storeLocation?: string;
    price?: number;
    maxPrice?: number;
    status: 'open' | 'fulfilled';
    fulfilledBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PriceRequestSchema: Schema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
        requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        storeLocation: { type: String },
        price: { type: Number },
        maxPrice: { type: Number },
        status: { type: String, enum: ['open', 'fulfilled'], default: 'open' },
        fulfilledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    {
        timestamps: true,
    }
);

// We usually only care about active requests for a specific product
PriceRequestSchema.index({ productId: 1, status: 1 });

const PriceRequest: Model<IPriceRequest> = mongoose.models.PriceRequest || mongoose.model<IPriceRequest>('PriceRequest', PriceRequestSchema);

export default PriceRequest;
