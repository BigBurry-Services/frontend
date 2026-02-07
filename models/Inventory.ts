import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInventory extends Document {
  id: string;
  name: string;
  categoryID: string;
  unitPrice: number;
  batches: {
    batchNumber: string;
    quantity: number;
    expiryDate: Date;
    addedDate: Date;
  }[];
}

const InventorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    categoryID: String,
    unitPrice: Number,
    batches: [
      {
        batchNumber: String,
        quantity: Number,
        expiryDate: Date,
        addedDate: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

if (mongoose.models.Inventory) {
  delete (mongoose as any).models.Inventory;
}

const Inventory: Model<IInventory> = mongoose.model<IInventory>(
  "Inventory",
  InventorySchema,
);

export default Inventory;
