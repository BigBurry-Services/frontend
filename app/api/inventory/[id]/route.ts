import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Inventory from "@/models/Inventory";

// GET /api/inventory/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const item = await Inventory.findOne({ id } as any);
    if (!item) {
      return NextResponse.json(
        { message: "Medicine not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PATCH /api/inventory/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const {
      id: _,
      createdAt: __,
      updatedAt: ___,
      ...updates
    } = await req.json();
    const updatedItem = await Inventory.update(id, updates);
    if (!updatedItem) {
      return NextResponse.json(
        { message: "Medicine not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(updatedItem);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE /api/inventory/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const success = await Inventory.delete(id);
    if (!success) {
      return NextResponse.json(
        { message: "Medicine not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ message: "Medicine deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
