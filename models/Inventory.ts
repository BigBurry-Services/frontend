import { JsonStorage } from "../lib/jsonStorage";

export interface IBatch {
  batchNumber: string;
  quantity: number;
  expiryDate: Date;
  addedDate: Date;
}

export interface IInventory {
  id: string;
  name: string;
  categoryID: string;
  unitPrice: number;
  batches: IBatch[];
  createdAt: Date;
  updatedAt: Date;
}

const Inventory = new JsonStorage<IInventory>("inventory");

export default Inventory;
