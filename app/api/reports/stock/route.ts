import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import StockLog from "@/models/StockLog";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const logs = await StockLog.find({});
    // Sort by timestamp desc
    logs.sort(
      (a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
