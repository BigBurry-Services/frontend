import { JsonStorage } from "../lib/jsonStorage";

export interface ITreatment {
  id: string;
  name: string;
  price: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const Treatment = new JsonStorage<ITreatment>("treatments");

export default Treatment;
