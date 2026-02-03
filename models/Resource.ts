import { JsonStorage } from "../lib/jsonStorage";

export interface IResource {
  id: string;
  resourceID: string;
  name: string;
  type: string;
  isOccupied: boolean;
  currentPatientID?: string;
  admissionDate?: string;
  expectedDischargeDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

const Resource = new JsonStorage<IResource>("resources");

export default Resource;
