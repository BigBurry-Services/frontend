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
    const newItem = await Inventory.create(body);
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
    const { id, attrs } = body;

    if (id && attrs) {
      const updatedItem = await Inventory.update(id, attrs);
      return NextResponse.json(updatedItem);
    }

    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
