import mongoose, { Schema, Document, Model } from "mongoose";

export enum VisitStatus {
  WAITING = "waiting",
  IN_CONSULTATION = "in_consultation",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  WAITING_FOR_PAYMENT = "waiting_for_payment",
}

export interface IVisit extends Document {
  tokenNumber: number;
  patientID: string;
  doctorIDs: string[];
  notes?: string;
  reason?: string;
  prescriptions: { name: string; dosage: string; instruction: string }[];
  consultations: {
    doctorID: string;
    doctorName: string;
    status: VisitStatus;
    notes?: string;
    prescriptions: {
      name: string;
      dosage: string;
      instruction: string;
      quantity: number;
    }[];
  }[];
  status: string;
  paymentStatus: string;
  visitDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VisitSchema: Schema = new Schema(
  {
    tokenNumber: { type: Number, required: true },
    patientID: { type: String, required: true },
    doctorIDs: { type: [String], required: true },
    notes: { type: String },
    reason: { type: String },
    prescriptions: [
      {
        name: { type: String },
        dosage: { type: String },
        instruction: { type: String },
      },
    ],
    consultations: [
      {
        doctorID: { type: String },
        doctorName: { type: String },
        status: {
          type: String,
          enum: Object.values(VisitStatus),
          default: VisitStatus.WAITING,
        },
        notes: { type: String },
        prescriptions: [
          {
            name: { type: String },
            dosage: { type: String },
            instruction: { type: String },
            quantity: { type: Number, default: 1 },
          },
        ],
      },
    ],
    status: { type: String, default: "Waiting" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    visitDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const Visit: Model<IVisit> =
  mongoose.models.Visit || mongoose.model<IVisit>("Visit", VisitSchema);

export default Visit;
