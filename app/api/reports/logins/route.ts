import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AuditLog from "@/models/AuditLog";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Fetch logs (filter for LOGIN/LOGOUT just in case we add others later)
    const logs = await AuditLog.find({});
    const authLogs = logs.filter(
      (l: any) => l.action === "LOGIN" || l.action === "LOGOUT",
    );

    // Sort by timestamp desc
    authLogs.sort(
      (a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return NextResponse.json(authLogs);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
