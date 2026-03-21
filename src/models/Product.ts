import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    brand?: string;
    variant?: string;
    size?: string;
    price: number;
    maxPrice?: number;
    category: string;
    isFeatured?: boolean;
    storeId?: mongoose.Types.ObjectId;
    storeLocation?: string; // Kept for transition/migration
    imageUrl: string;
    reportCount: number;
    confidenceLevel: 'Low' | 'Medium' | 'High';
    flagged: boolean;
    updateRequested: boolean;
    priceHistory: Array<{ price: number, maxPrice?: number, verifiedAt: Date }>;
    lastUpdated: Date;
    lastUpdatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        brand: { type: String, trim: true },
        variant: { type: String, trim: true },
        size: { type: String, trim: true },
        price: { type: Number, required: true },
        maxPrice: { type: Number },
        category: { type: String, required: true },
        storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
        storeLocation: { type: String },
        imageUrl: { type: String, required: true },
        reportCount: { type: Number, default: 0 },
        confidenceLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
        flagged: { type: Boolean, default: false },
        isFeatured: { type: Boolean, default: false },
        updateRequested: { type: Boolean, default: false },
        priceHistory: [{
            price: { type: Number, required: true },
            maxPrice: { type: Number },
            verifiedAt: { type: Date, default: Date.now }
        }],
        lastUpdated: { type: Date, default: Date.now },
        lastUpdatedBy: { type: String, default: null },
    },
    {
        timestamps: true,
    }
);

// Prevent model overwrite error in development
const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
