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

    // Fetch all records
    const allInvoices = await Invoice.find();
    const allExpenses = await Expense.find();

    let sales, expenses;

    if (scope === "daily") {
      sales = allInvoices.filter(
        (inv) => new Date(inv.createdAt).toISOString().split("T")[0] === date,
      );
      expenses = allExpenses.filter((exp) => exp.date === date);
    } else if (scope === "monthly") {
      const monthPrefix = date.substring(0, 7); // YYYY-MM
      sales = allInvoices.filter(
        (inv) =>
          new Date(inv.createdAt)
            .toISOString()
            .split("T")[0]
            .substring(0, 7) === monthPrefix,
      );
      expenses = allExpenses.filter(
        (exp) => exp.date.substring(0, 7) === monthPrefix,
      );
    } else if (scope === "yearly") {
      const yearPrefix = date.substring(0, 4); // YYYY
      sales = allInvoices.filter(
        (inv) =>
          new Date(inv.createdAt)
            .toISOString()
            .split("T")[0]
            .substring(0, 4) === yearPrefix,
      );
      expenses = allExpenses.filter(
        (exp) => exp.date.substring(0, 4) === yearPrefix,
      );
    } else {
      // scope === "all"
      sales = allInvoices;
      expenses = allExpenses;
    }

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
