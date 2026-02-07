import { NextResponse } from "next/server";
import PatientPackage from "../../../models/PatientPackage";
import dbConnect from "@/lib/db";

export async function GET() {
  try {
    await dbConnect();
    const assignments = await PatientPackage.find({}).lean();
    return NextResponse.json(assignments);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch patient packages" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { patientID, patientName, packageID, packageName, startDate } = body;

    if (!patientID || !packageID || !startDate) {
      return NextResponse.json(
        { message: "Patient, Package, and Start Date are required" },
        { status: 400 },
      );
    }

    const newAssignment = await PatientPackage.create({
      patientID,
      patientName,
      packageID,
      packageName,
      startDate,
      status: "active",
    });

    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to assign package" },
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

  await PatientPackage.findByIdAndDelete(id);
  return NextResponse.json({ message: "Assignment removed" });
}
