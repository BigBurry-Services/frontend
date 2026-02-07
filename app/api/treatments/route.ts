import { NextResponse } from "next/server";
import Treatment from "../../../models/Treatment";
import dbConnect from "@/lib/db";

export async function GET() {
  await dbConnect();
  const treatments = await Treatment.find({}).lean();
  return NextResponse.json(treatments);
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, price, description } = body;

    if (!name || !price) {
      return NextResponse.json(
        { message: "Name and Price are required" },
        { status: 400 },
      );
    }

    const newTreatment = await Treatment.create({
      name,
      price: Number(price),
      description,
    });

    return NextResponse.json(newTreatment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create treatment" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, name, price, description } = body;

    if (!id || !name || !price) {
      return NextResponse.json(
        { message: "ID, Name and Price are required" },
        { status: 400 },
      );
    }

    const updatedTreatment = await Treatment.findByIdAndUpdate(
      id,
      {
        name,
        price: Number(price),
        description,
      },
      { new: true },
    ).lean();

    if (!updatedTreatment) {
      return NextResponse.json(
        { message: "Treatment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedTreatment);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update treatment" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "ID is required" }, { status: 400 });
  }

  await Treatment.findByIdAndDelete(id);
  return NextResponse.json({ message: "Treatment deleted" });
}
