import mongoose, { Schema, Document, Model } from "mongoose";

export enum VisitStatus {
  WAITING = "waiting",
  IN_CONSULTATION = "in_consultation",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  WAITING_FOR_PAYMENT = "waiting_for_payment",
}

export interface IVisit extends Document {
  id: string;
  tokenNumber: number;
  patientID: string;
  doctorIDs: string[];
  notes?: string;
  reason?: string;
  prescriptions: {
    name: string;
    dosage: string;
    instruction: string;
    quantity: number;
  }[];
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
    services: {
      name: string;
      price: number;
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
    doctorIDs: { type: [String], default: [] },
    notes: { type: String },
    reason: { type: String },
    prescriptions: [
      {
        name: String,
        dosage: String,
        instruction: String,
        quantity: Number,
      },
    ],
    consultations: [
      {
        doctorID: String,
        doctorName: String,
        status: { type: String, enum: Object.values(VisitStatus) },
        notes: String,
        prescriptions: [
          {
            name: String,
            dosage: String,
            instruction: String,
            quantity: Number,
          },
        ],
        services: [
          {
            name: String,
            price: Number,
          },
        ],
      },
    ],
    status: { type: String, default: "waiting" },
    paymentStatus: { type: String, default: "pending" },
    visitDate: { type: Date, default: Date.now },
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

if (mongoose.models.Visit) {
  delete (mongoose as any).models.Visit;
}
const Visit: Model<IVisit> = mongoose.model<IVisit>("Visit", VisitSchema);

export default Visit;
