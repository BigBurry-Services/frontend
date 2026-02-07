import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStockLog extends Document {
  id: string;
  itemID: string;
  itemName: string;
  type: "addition" | "deduction";
  quantity: number;
  reason: string;
  batchNumber?: string;
  timestamp: Date;
}

const StockLogSchema: Schema = new Schema(
  {
    itemID: { type: String, required: true },
    itemName: { type: String, required: true },
    type: { type: String, enum: ["addition", "deduction"], required: true },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true },
    batchNumber: String,
    timestamp: { type: Date, default: Date.now },
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

if (mongoose.models.StockLog) {
  delete (mongoose as any).models.StockLog;
}

const StockLog: Model<IStockLog> = mongoose.model<IStockLog>(
  "StockLog",
  StockLogSchema,
);

export default StockLog;
