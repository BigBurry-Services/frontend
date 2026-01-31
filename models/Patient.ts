import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPatient extends Document {
  patientID: string;
  name: string;
  age: number;
  gender: string;
  mobile: string;
  address?: string;
  guardianName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema: Schema = new Schema(
  {
    patientID: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    mobile: { type: String, required: true, index: true },
    address: { type: String },
    guardianName: { type: String },
  },
  { timestamps: true },
);

const Patient: Model<IPatient> =
  mongoose.models.Patient || mongoose.model<IPatient>("Patient", PatientSchema);

export default Patient;
