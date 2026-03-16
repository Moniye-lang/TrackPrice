import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
    adminId: mongoose.Types.ObjectId;
    action: string;
    details: any;
    createdAt: Date;
    updatedAt: Date;
}

const AuditLogSchema: Schema = new Schema(
    {
        adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        action: { type: String, required: true },
        details: { type: Schema.Types.Mixed }, // Can store any object structure
    },
    {
        timestamps: true,
    }
);

if (mongoose.models.AuditLog) {
    delete mongoose.models.AuditLog;
}

const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
