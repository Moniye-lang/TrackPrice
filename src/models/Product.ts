import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    price: number;
    category: string;
    storeLocation?: string;
    imageUrl: string;
    reportCount: number;
    confidenceLevel: 'Low' | 'Medium' | 'High';
    flagged: boolean;
    updateRequested: boolean;
    priceHistory: Array<{ price: number, verifiedAt: Date }>;
    lastUpdated: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        category: { type: String, required: true },
        storeLocation: { type: String },
        imageUrl: { type: String, required: true },
        reportCount: { type: Number, default: 0 },
        confidenceLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
        flagged: { type: Boolean, default: false },
        updateRequested: { type: Boolean, default: false },
        priceHistory: [{
            price: { type: Number, required: true },
            verifiedAt: { type: Date, default: Date.now }
        }],
        lastUpdated: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

// Prevent model overwrite error in development
const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
