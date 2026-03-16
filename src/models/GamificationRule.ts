import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGamificationRule extends Document {
    pointsPerUpdate: number;
    bonusPointsRequest: number;
    dailyUpdateLimit: number;
    verificationThreshold: number;
    createdAt: Date;
    updatedAt: Date;
}

const GamificationRuleSchema: Schema = new Schema(
    {
        pointsPerUpdate: { type: Number, default: 10 },
        bonusPointsRequest: { type: Number, default: 20 },
        dailyUpdateLimit: { type: Number, default: 20 },
        verificationThreshold: { type: Number, default: 5 },
    },
    {
        timestamps: true,
    }
);

if (mongoose.models.GamificationRule) {
    delete mongoose.models.GamificationRule;
}

const GamificationRule: Model<IGamificationRule> = mongoose.model<IGamificationRule>('GamificationRule', GamificationRuleSchema);

export default GamificationRule;
