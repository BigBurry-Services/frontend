import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Visit from "@/models/Visit";

// GET /api/visits/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;

    const visit = await Visit.findById(id);

    if (!visit) {
      return NextResponse.json({ message: "Visit not found" }, { status: 404 });
    }

    return NextResponse.json(visit);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PUT /api/visits/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const updatedVisit = await Visit.update(id, body);

    if (!updatedVisit) {
      return NextResponse.json({ message: "Visit not found" }, { status: 404 });
    }

    return NextResponse.json(updatedVisit);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
