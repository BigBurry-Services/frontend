import mongoose, { Schema, Document, Model } from "mongoose";

export interface IResource extends Document {
  id: string;
  resourceID: string;
  name: string;
  type: string;
  isOccupied: boolean;
  currentPatientID?: string;
  admissionDate?: string;
  expectedDischargeDate?: string;
}

const ResourceSchema: Schema = new Schema(
  {
    resourceID: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    isOccupied: { type: Boolean, default: false },
    currentPatientID: String,
    admissionDate: String,
    expectedDischargeDate: String,
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

if (mongoose.models.Resource) {
  delete (mongoose as any).models.Resource;
}

const Resource: Model<IResource> = mongoose.model<IResource>(
  "Resource",
  ResourceSchema,
);

export default Resource;
