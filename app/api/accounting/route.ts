import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import Invoice from "@/models/Invoice";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];

    const scope = searchParams.get("scope") || "all";

    const invoiceFilter: any = {};
    const expenseFilter: any = {};

    if (scope === "daily") {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      invoiceFilter.createdAt = { $gte: startOfDay, $lte: endOfDay };
      expenseFilter.date = date; // Expense date is string YYYY-MM-DD
    } else if (scope === "monthly") {
      const monthPrefix = date.substring(0, 7);
      const startOfMonth = new Date(monthPrefix + "-01");
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      invoiceFilter.createdAt = { $gte: startOfMonth, $lt: endOfMonth };
      expenseFilter.date = { $regex: `^${monthPrefix}` };
    } else if (scope === "yearly") {
      const yearPrefix = date.substring(0, 4);
      const startOfYear = new Date(yearPrefix + "-01-01");
      const endOfYear = new Date(yearPrefix + "-12-31T23:59:59.999Z");

      invoiceFilter.createdAt = { $gte: startOfYear, $lte: endOfYear };
      expenseFilter.date = { $regex: `^${yearPrefix}` };
    }

    const sales = await Invoice.find(invoiceFilter).lean();
    const expenses = await Expense.find(expenseFilter).lean();

    const totalSales = sales.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return NextResponse.json({
      sales,
      expenses,
      summary: {
        totalSales,
        totalExpenses,
        netBalance: totalSales - totalExpenses,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const newExpense = await Expense.create({
      ...body,
      date: body.date || new Date().toISOString().split("T")[0],
    });
    return NextResponse.json(newExpense, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
