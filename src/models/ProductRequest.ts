import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductRequest extends Document {
    name: string;
    brand?: string;
    variant?: string;
    size?: string;
    category: string;
    userId: mongoose.Types.ObjectId;
    status: 'pending' | 'approved' | 'denied';
    adminNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProductRequestSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        brand: { type: String },
        variant: { type: String },
        size: { type: String },
        category: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
        adminNotes: { type: String },
    },
    {
        timestamps: true,
    }
);

ProductRequestSchema.index({ status: 1 });
ProductRequestSchema.index({ userId: 1 });

const ProductRequest: Model<IProductRequest> = mongoose.models.ProductRequest || mongoose.model<IProductRequest>('ProductRequest', ProductRequestSchema);

export default ProductRequest;
