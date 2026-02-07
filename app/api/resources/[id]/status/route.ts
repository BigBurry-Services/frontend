import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Resource from "@/models/Resource";

// PATCH /api/resources/[id]/status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    // id here is resourceID (e.g. BED-101)
    const resource = await Resource.findOne({ resourceID: id });
    const actualId = resource ? resource.id : id;

    const updatedResource = await Resource.findByIdAndUpdate(
      actualId,
      {
        isOccupied: body.isOccupied,
        currentPatientID: body.patientID || null,
        admissionDate: body.admissionDate || null,
        expectedDischargeDate: body.expectedDischargeDate || null,
      },
      { new: true },
    ).lean();

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
