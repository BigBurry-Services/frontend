import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Patient from "@/models/Patient";

// GET /api/patients/[id] - Fetch by patientID (e.g. PAT-2026-001) or internal id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Try finding by patientID first
    let patient = await Patient.findOne({ patientID: id });

    // Fallback to internal id
    if (!patient) {
      patient = await Patient.findById(id);
    }

    if (!patient) {
      return NextResponse.json(
        { message: "Patient not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(patient);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PUT /api/patients/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    let patient = await Patient.findOne({ patientID: id });
    const actualId = patient ? patient.id : id;

    const updatedPatient = await Patient.update(actualId, body);

    if (!updatedPatient) {
      return NextResponse.json(
        { message: "Patient not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedPatient);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
