import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { username } = await req.json();

    if (username) {
      const user = await User.findOne({ username });
      if (user) {
        await AuditLog.create({
          userId: user.id,
          username: user.username,
          action: "LOGOUT",
          timestamp: new Date(),
        });
      }
    }

    return NextResponse.json({ message: "Logged out" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
