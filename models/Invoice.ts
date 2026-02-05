import { JsonStorage } from "../lib/jsonStorage";

export interface IInvoice {
  id: string;
  invoiceNumber: string;
  patientID: string;
  patientName: string;
  items: { description: string; amount: number; visitID?: string }[];
  totalAmount: number;
  paymentMode: string;
  paymentBreakdown?: { mode: string; amount: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const Invoice = new JsonStorage<IInvoice>("invoices");

export default Invoice;
