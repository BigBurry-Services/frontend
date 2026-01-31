import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Inventory from "@/models/Inventory";

// GET /api/inventory
export async function GET() {
  try {
    await dbConnect();
    const items = await Inventory.find();
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/inventory
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const newItem = new Inventory(body);
    await newItem.save();
    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PATCH /api/inventory (for dispense and generic update)
export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, name, quantity, attrs } = body;

    if (quantity && name) {
      // Dispense logic
      const item = await Inventory.findOne({ name });
      if (!item)
        return NextResponse.json(
          { message: "Medicine not found" },
          { status: 404 },
        );
      if (item.stock < quantity)
        return NextResponse.json(
          { message: "Insufficient stock" },
          { status: 400 },
        );
      item.stock -= quantity;
      await item.save();
      return NextResponse.json(item);
    }

    if (id && attrs) {
      const updatedItem = await Inventory.findByIdAndUpdate(id, attrs, {
        new: true,
      });
      return NextResponse.json(updatedItem);
    }

    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
