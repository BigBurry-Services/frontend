import mongoose, { Schema, Document, Model } from "mongoose";

export enum ResourceType {
  WARD_BED = "ward_bed",
  ICU_BED = "icu_bed",
  PRIVATE_ROOM = "private_room",
}

export interface IResource extends Document {
  resourceID: string;
  name: string;
  type: ResourceType;
  isOccupied: boolean;
  currentPatientID?: string;
  admissionDate?: Date;
  expectedDischargeDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema: Schema = new Schema(
  {
    resourceID: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: Object.values(ResourceType) },
    isOccupied: { type: Boolean, default: false },
    currentPatientID: { type: String },
    admissionDate: { type: Date },
    expectedDischargeDate: { type: Date },
  },
  { timestamps: true },
);

const Resource: Model<IResource> =
  mongoose.models.Resource ||
  mongoose.model<IResource>("Resource", ResourceSchema);

export default Resource;
