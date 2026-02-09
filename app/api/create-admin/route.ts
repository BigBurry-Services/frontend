import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User, { UserRole } from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await dbConnect();

    const adminExists = await User.findOne({ role: UserRole.ADMIN });

    if (adminExists) {
      return NextResponse.json({
        success: true,
        message: `Admin user already exists: ${adminExists.username}`,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    const admin = await User.create({
      username: "admin",
      password: hashedPassword,
      role: UserRole.ADMIN,
      name: "Super Admin",
    });

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      user: {
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
