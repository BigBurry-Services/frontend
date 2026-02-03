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
  createdAt: Date;
  updatedAt: Date;
}

const Patient = new JsonStorage<IPatient>("patients");

export default Patient;
