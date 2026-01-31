import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Resource from "@/models/Resource";

// GET /api/resources
export async function GET() {
  try {
    await dbConnect();
    const resources = await Resource.find();
    return NextResponse.json(resources);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/resources
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const newResource = new Resource(body);
    await newResource.save();
    return NextResponse.json(newResource, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PATCH /api/resources/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    // id here is resourceID
    const updatedResource = await Resource.findOneAndUpdate(
      { resourceID: id },
      body,
      { new: true },
    );

    // Note: Socket.io emission is missing here since Next.js API routes are stateless.
    // However, the frontend can be updated to poll or use another real-time solution if needed.

    return NextResponse.json(updatedResource);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
