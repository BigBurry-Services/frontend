import { JsonStorage } from "../lib/jsonStorage";

export interface IPatient {
  id: string;
  patientID: string;
  name: string;
  age: number;
  gender: string;
  mobile: string;
  address?: string;
  guardianName?: string;
  documents?: {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
    uploadedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const Patient = new JsonStorage<IPatient>("patients");

export default Patient;
