import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  id: string;
  userId: string;
  username: string;
  action: string;
  details?: string;
  timestamp: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    action: { type: String, required: true },
    details: String,
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

if (mongoose.models.AuditLog) {
  delete (mongoose as any).models.AuditLog;
}

const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>(
  "AuditLog",
  AuditLogSchema,
);

export default AuditLog;
