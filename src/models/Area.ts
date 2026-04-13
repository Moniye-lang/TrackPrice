import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IArea extends Document {
    name: string;
    state: 'Oyo' | 'Lagos';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AreaSchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        state: { type: String, required: true, enum: ['Oyo', 'Lagos'] },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

// Ensure uniqueness per state
AreaSchema.index({ name: 1, state: 1 }, { unique: true });

const Area: Model<IArea> = mongoose.models.Area || mongoose.model<IArea>('Area', AreaSchema);

export default Area;
