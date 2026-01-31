import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvoice extends Document {
  invoiceNumber: string;
  patientID: string;
  patientName: string;
  items: { description: string; amount: number; visitID?: string }[];
  totalAmount: number;
  paymentMode: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema: Schema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    patientID: { type: String, required: true },
    patientName: { type: String, required: true },
    items: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        visitID: { type: String },
      },
    ],
    totalAmount: { type: Number, required: true },
    paymentMode: { type: String, required: true },
  },
  { timestamps: true },
);

const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);

export default Invoice;
