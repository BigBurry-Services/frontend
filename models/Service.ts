import { JsonStorage } from "../lib/jsonStorage";

export interface IService {
  id: string;
  name: string;
  price: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const Service = new JsonStorage<IService>("services");

export default Service;
