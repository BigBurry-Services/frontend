import { NextResponse } from "next/server";
import Package from "../../../models/Package";

export async function GET() {
  const packages = await Package.find({});
  return NextResponse.json(packages);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, totalPrice, items, description } = body;

    if (!name || totalPrice === undefined || !items) {
      return NextResponse.json(
        { message: "Name, Total Price, and Items are required" },
        { status: 400 },
      );
    }

    const newPackage = await Package.create({
      name,
      totalPrice: Number(totalPrice),
      items,
      description,
    });

    return NextResponse.json(newPackage, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create package" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, totalPrice, items, description } = body;

    if (!id || !name || totalPrice === undefined || !items) {
      return NextResponse.json(
        { message: "ID, Name, Total Price, and Items are required" },
        { status: 400 },
      );
    }

    const updatedPackage = await Package.update(id, {
      name,
      totalPrice: Number(totalPrice),
      items,
      description,
    });

    if (!updatedPackage) {
      return NextResponse.json(
        { message: "Package not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedPackage);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update package" },
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

  await Package.delete(id);
  return NextResponse.json({ message: "Package deleted" });
}
