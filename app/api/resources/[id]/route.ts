import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Resource from "@/models/Resource";

// PATCH /api/resources/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    // Try finding by resourceID first
    const resource = await Resource.findOne({ resourceID: id });
    const actualId = resource ? resource.id : id;

    const updatedResource = await Resource.update(actualId, body);

    if (!updatedResource) {
      return NextResponse.json(
        { message: "Resource not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedResource);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE /api/resources/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;

    const resource = await Resource.findOne({ resourceID: id });
    const actualId = resource ? resource.id : id;

    if (!actualId) {
      return NextResponse.json(
        { message: "Resource not found" },
        { status: 404 },
      );
    }

    const deleted = await Resource.delete(actualId);

    if (!deleted) {
      return NextResponse.json(
        { message: "Resource not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Resource deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
