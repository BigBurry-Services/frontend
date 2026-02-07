import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import StockLog from "@/models/StockLog";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const logs = await StockLog.find({}).sort({ timestamp: -1 }).lean();

    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
