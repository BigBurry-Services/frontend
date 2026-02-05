import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AuditLog from "@/models/AuditLog";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { username, password } = await req.json();

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role,
      name: user.name,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

    // Log the login event
    await AuditLog.create({
      userId: user.id,
      username: user.username,
      action: "LOGIN",
      timestamp: new Date(),
    });

    return NextResponse.json({
      access_token: token,
      user: payload,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
