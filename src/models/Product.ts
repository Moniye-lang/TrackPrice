import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    price: number;
    category: string;
    imageUrl: string;
    lastUpdated: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        category: { type: String, required: true },
        imageUrl: { type: String, required: true },
        lastUpdated: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

// Prevent model overwrite error in development
const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
