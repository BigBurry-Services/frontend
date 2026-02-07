import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Inventory from "@/models/Inventory";
import StockLog from "@/models/StockLog";

// GET /api/inventory/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const item = await Inventory.findById(id).lean();
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
    const oldItem = await Inventory.findById(id).lean();

    // Log Stock Changes if batches are updated
    if (oldItem && updates.batches) {
      const oldQty = oldItem.batches.reduce(
        (sum: number, b: any) => sum + Number(b.quantity),
        0,
      );
      const newQty = updates.batches.reduce(
        (sum: number, b: any) => sum + Number(b.quantity),
        0,
      );
      const diff = newQty - oldQty;

      if (diff !== 0) {
        await StockLog.create({
          itemID: id,
          itemName: oldItem.name,
          quantity: Math.abs(diff),
          type: diff > 0 ? "addition" : "deduction",
          reason: diff > 0 ? "Stock Added (Update)" : "Stock Removed (Update)",
          timestamp: new Date(),
        });
      }
    }

    const updatedItem = await Inventory.findByIdAndUpdate(id, updates, {
      new: true,
    }).lean();
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
    const success = await Inventory.findByIdAndDelete(id);
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
