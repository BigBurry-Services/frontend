import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPatientDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: Date;
}

export interface IPatient extends Document {
  id: string;
  patientID: string;
  name: string;
  age: number;
  gender: string;
  mobile: string;
  address?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  medicalHistory?: string[];
  documents?: IPatientDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema: Schema = new Schema(
  {
    patientID: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String },
    bloodGroup: { type: String },
    emergencyContact: { type: String },
    medicalHistory: { type: [String], default: [] },
    documents: [
      {
        id: String,
        name: String,
        type: String,
        url: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
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

if (mongoose.models.Patient) {
  delete (mongoose as any).models.Patient;
}

const Patient: Model<IPatient> = mongoose.model<IPatient>(
  "Patient",
  PatientSchema,
);

export default Patient;
