import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import Expense from "@/models/Expense";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const invoices = await Invoice.find({}).sort({ createdAt: -1 }).lean();
    const expenses = await Expense.find({})
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const reportData: any[] = [];

    invoices.forEach((inv: any) => {
      reportData.push({
        id: inv.id,
        date: inv.createdAt,
        description: `Invoice #${inv.invoiceNumber} - ${inv.patientName}`,
        type: "INCOME",
        amount: inv.totalAmount,
      });
    });

    expenses.forEach((exp: any) => {
      reportData.push({
        id: exp.id,
        date: exp.date || exp.createdAt, // expense has manually entered 'date' usually
        description: `Expense: ${exp.description} (${exp.category})`,
        type: "EXPENSE",
        amount: exp.amount,
      });
    });

    return NextResponse.json(reportData);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
