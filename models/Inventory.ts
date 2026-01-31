import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInventory extends Document {
  name: string;
  stock: number;
  unitPrice: number;
  batchNumber?: string;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    stock: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    batchNumber: { type: String },
    expiryDate: { type: Date },
  },
  { timestamps: true },
);

const Inventory: Model<IInventory> =
  mongoose.models.Inventory ||
  mongoose.model<IInventory>("Inventory", InventorySchema);

export default Inventory;
