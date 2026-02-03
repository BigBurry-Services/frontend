import { JsonStorage } from "../lib/jsonStorage";

export enum VisitStatus {
  WAITING = "waiting",
  IN_CONSULTATION = "in_consultation",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  WAITING_FOR_PAYMENT = "waiting_for_payment",
}

export interface IVisit {
  id: string;
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

const Visit = new JsonStorage<IVisit>("visits");

export default Visit;
