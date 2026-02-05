import { JsonStorage } from "../lib/jsonStorage";

export interface IPatientPackage {
  id: string;
  patientID: string;
  patientName: string;
  packageID: string;
  packageName: string;
  startDate: string;
  endDate?: string;
  status: "active" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const PatientPackage = new JsonStorage<IPatientPackage>("patient_packages");

export default PatientPackage;
