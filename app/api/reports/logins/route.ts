import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AuditLog from "@/models/AuditLog";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Fetch logs (filter for LOGIN/LOGOUT just in case we add others later)
    const authLogs = await AuditLog.find({
      action: { $in: ["LOGIN", "LOGOUT"] },
    })
      .sort({ timestamp: -1 })
      .lean();

    return NextResponse.json(authLogs);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
