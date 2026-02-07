import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExpense extends Document {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
}

const ExpenseSchema: Schema = new Schema(
  {
    date: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
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

if (mongoose.models.Expense) {
  delete (mongoose as any).models.Expense;
}

const Expense: Model<IExpense> = mongoose.model<IExpense>(
  "Expense",
  ExpenseSchema,
);

export default Expense;
