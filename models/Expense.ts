import { JsonStorage } from "../lib/jsonStorage";

export interface IExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  paymentMode: string;
  paymentBreakdown?: { mode: string; amount: number }[];
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

const Expense = new JsonStorage<IExpense>("expenses");

export default Expense;
