import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPatientPackage extends Document {
  id: string;
  patientID: string;
  packageID: string;
  startDate: Date;
  status: "active" | "completed" | "cancelled";
  remainingItems: string[];
}

const PatientPackageSchema: Schema = new Schema(
  {
    patientID: { type: String, required: true },
    packageID: { type: String, required: true },
    startDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    remainingItems: { type: [String], default: [] },
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

if (mongoose.models.PatientPackage) {
  delete (mongoose as any).models.PatientPackage;
}

const PatientPackage: Model<IPatientPackage> = mongoose.model<IPatientPackage>(
  "PatientPackage",
  PatientPackageSchema,
);

export default PatientPackage;
