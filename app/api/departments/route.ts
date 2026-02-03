import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Department from "@/models/Department";

// GET /api/departments
export async function GET() {
  try {
    await dbConnect();
    const departments = await Department.find();
    // Manually sort by name
    departments.sort((a, b) => a.name.localeCompare(b.name));
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
    const newDept = await Department.create(body);
    return NextResponse.json(newDept, { status: 201 });
  } catch (error: any) {
    // Note: Manual check for duplicates if necessary, or let file write handle it
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
    await Department.delete(id);
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
