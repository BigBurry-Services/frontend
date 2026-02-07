import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// PATCH /api/users/[username]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    await dbConnect();
    const { username } = await params;
    const body = await req.json();

    // Find user by username
    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const updates: any = { ...body };

    // Handle password update
    if (updates.password && updates.password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    } else {
      // Remove password from updates if it's empty (to avoid overwriting with empty string)
      delete updates.password;
    }

    // Prevent changing the username itself if it conflicts (optional, but good practice)
    if (updates.username && updates.username !== username) {
      const existingShortcheck = await User.findOne({
        username: updates.username,
      });
      if (existingShortcheck) {
        return NextResponse.json(
          { message: "Username already taken" },
          { status: 400 },
        );
      }
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, updates, {
      new: true,
    })
      .select("-password")
      .lean();

    if (!updatedUser) {
      return NextResponse.json(
        { message: "Failed to update user" },
        { status: 500 },
      );
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE /api/users/[username]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    await dbConnect();
    const { username } = await params;

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    await User.findByIdAndDelete(user._id);

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
