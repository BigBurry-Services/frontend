import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Service from "@/models/Service";

// GET /api/services
export async function GET() {
  try {
    await dbConnect();
    const services = await Service.find();
    services.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json(services);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/services
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const newService = await Service.create({
      ...body,
      price: Number(body.price) || 0,
    });
    return NextResponse.json(newService, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE /api/services?id=...
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ message: "ID required" }, { status: 400 });
    await Service.delete(id);
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
