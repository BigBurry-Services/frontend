import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Patient from "@/models/Patient";

// GET /api/patients
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const mobile = searchParams.get("mobile");

    if (mobile) {
      const patients = await Patient.find({
        mobile: { $regex: mobile, $options: "i" },
      });
      return NextResponse.json(patients);
    }

    const patients = await Patient.find();
    return NextResponse.json(patients);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/patients
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const totalPatients = await Patient.countDocuments();
    const patientID = `PAT-${new Date().getFullYear()}-${String(totalPatients + 1).padStart(3, "0")}`;

    const newPatient = await Patient.create({
      ...body,
      patientID,
    });

    return NextResponse.json(newPatient, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
