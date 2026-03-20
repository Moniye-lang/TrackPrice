import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStore extends Document {
    name: string;
    area: string;
    city: string;
    type: 'Supermarket' | 'Market' | 'Other';
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const StoreSchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        area: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        type: { type: String, enum: ['Supermarket', 'Market', 'Other'], default: 'Supermarket' },
        imageUrl: { type: String },
    },
    {
        timestamps: true,
    }
);

// To ensure uniqueness and faster searches
StoreSchema.index({ name: 1, area: 1, city: 1 }, { unique: true });

const Store: Model<IStore> = mongoose.models.Store || mongoose.model<IStore>('Store', StoreSchema);

export default Store;
