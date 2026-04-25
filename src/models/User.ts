import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    points: number;
    reputationLevel: 'Beginner' | 'Trusted Contributor' | 'Elite Contributor';
    rewardedUpdatesToday: number;
    lastRewardedDate: Date | null;
    city?: string;
    currentStreak: number;
    lastStreakUpdate: Date | null;
    isBanned: boolean;
    googleId?: string;
    resetOtp?: string;
    resetOtpExpiry?: Date;
    isEmailVerified: boolean;
    emailVerificationOtp?: string;
    emailVerificationOtpExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['admin', 'user'], default: 'user' },
        points: { type: Number, default: 0 },
        reputationLevel: {
            type: String,
            enum: ['Beginner', 'Trusted Contributor', 'Elite Contributor'],
            default: 'Beginner'
        },
        rewardedUpdatesToday: { type: Number, default: 0 },
        lastRewardedDate: { type: Date, default: null },
        city: { type: String, trim: true },
        currentStreak: { type: Number, default: 0 },
        lastStreakUpdate: { type: Date, default: null },
        isBanned: { type: Boolean, default: false },
        googleId: { type: String, unique: true, sparse: true },
        resetOtp: { type: String },
        resetOtpExpiry: { type: Date },
        isEmailVerified: { type: Boolean, default: false },
        emailVerificationOtp: { type: String },
        emailVerificationOtpExpiry: { type: Date },
    },
    {
        timestamps: true,
    }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
