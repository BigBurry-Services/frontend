import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Department from "@/models/Department";

// GET /api/departments
export async function GET() {
  try {
    await dbConnect();
    const departments = await Department.find().sort({ name: 1 });
    return NextResponse.json(departments);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/departments
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const newDept = new Department(body);
    await newDept.save();
    return NextResponse.json(newDept, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Department already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE /api/departments?id=...
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ message: "ID required" }, { status: 400 });
    await Department.findByIdAndDelete(id);
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
