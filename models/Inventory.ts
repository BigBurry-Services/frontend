import { JsonStorage } from "../lib/jsonStorage";

export interface IInventory {
  id: string;
  name: string;
  categoryID: string;
  unitPrice: number;
  batchNumber?: string;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const Inventory = new JsonStorage<IInventory>("inventory");

export default Inventory;
