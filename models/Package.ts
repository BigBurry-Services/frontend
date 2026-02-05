import { JsonStorage } from "../lib/jsonStorage";

export interface IPackageItem {
  type: "treatment" | "medicine" | "service" | "bed";
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface IPackage {
  id: string;
  name: string;
  description?: string;
  totalPrice: number;
  items: IPackageItem[];
  createdAt: Date;
  updatedAt: Date;
}

const Package = new JsonStorage<IPackage>("packages");

export default Package;
