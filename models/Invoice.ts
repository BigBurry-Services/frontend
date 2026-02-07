import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvoice extends Document {
  id: string;
  invoiceNumber: string;
  patientID: string;
  items: {
    description: string;
    amount: number;
    visitID?: string;
    packageAssignmentID?: string;
  }[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: "paid" | "partial" | "unpaid";
  paymentMethod?: string;
  createdAt: Date;
}

const InvoiceSchema: Schema = new Schema(
  {
    invoiceNumber: { type: String, required: true },
    patientID: { type: String, required: true },
    items: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        visitID: String,
        packageAssignmentID: String,
      },
    ],
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid",
    },
    paymentMethod: String,
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

if (mongoose.models.Invoice) {
  delete (mongoose as any).models.Invoice;
}

const Invoice: Model<IInvoice> = mongoose.model<IInvoice>(
  "Invoice",
  InvoiceSchema,
);

export default Invoice;
