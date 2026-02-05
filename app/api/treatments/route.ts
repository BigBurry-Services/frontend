import { NextResponse } from "next/server";
import Treatment from "../../../models/Treatment";

export async function GET() {
  const treatments = await Treatment.find({});
  return NextResponse.json(treatments);
}

export async function POST(req: Request) {
  try {
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
    const body = await req.json();
    const { id, name, price, description } = body;

    if (!id || !name || !price) {
      return NextResponse.json(
        { message: "ID, Name and Price are required" },
        { status: 400 },
      );
    }

    const updatedTreatment = await Treatment.update(id, {
      name,
      price: Number(price),
      description,
    });

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
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "ID is required" }, { status: 400 });
  }

  await Treatment.delete(id);
  return NextResponse.json({ message: "Treatment deleted" });
}
