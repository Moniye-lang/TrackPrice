import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScrapedProduct extends Document {
    name: string;
    price: number;
    sourceUrl: string;
    matchedProductId?: mongoose.Types.ObjectId;
    matchScore?: number;
    status: 'pending' | 'approved' | 'rejected' | 'edited';
    createdAt: Date;
    updatedAt: Date;
}

const ScrapedProductSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        sourceUrl: { type: String, required: true },
        matchedProductId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
        matchScore: { type: Number, default: 0 },
        status: { type: String, enum: ['pending', 'approved', 'rejected', 'edited'], default: 'pending' },
    },
    {
        timestamps: true,
    }
);

// Force clear Next.js cached model instance so the updated schema rules apply
if (mongoose.models.ScrapedProduct) {
    delete mongoose.models.ScrapedProduct;
}

const ScrapedProduct: Model<IScrapedProduct> = mongoose.model<IScrapedProduct>('ScrapedProduct', ScrapedProductSchema);

export default ScrapedProduct;
