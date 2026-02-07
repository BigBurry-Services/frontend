import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Visit, { VisitStatus } from "@/models/Visit";

// GET /api/visits
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const doctorID = searchParams.get("doctorID");
    const patientID = searchParams.get("patientID");
    const status = searchParams.get("status");

    const filter: any = {};
    if (doctorID) filter.doctorIDs = doctorID;
    if (patientID) filter.patientID = patientID;
    if (status) filter.status = status;

    const visits = await Visit.find(filter).sort({ tokenNumber: 1 }).lean();
    return NextResponse.json(visits);
  } catch (error: any) {
    console.error("DEBUG: GET /api/visits error:", error);
    return NextResponse.json(
      { message: error.message, stack: error.stack },
      { status: 500 },
    );
  }
}

// POST /api/visits
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const visitDate = body.visitDate ? new Date(body.visitDate) : new Date();
    const startOfDay = new Date(visitDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(visitDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check for existing visit for the same patient on the same day
    const existingVisit = await Visit.findOne({
      patientID: body.patientID,
      visitDate: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingVisit) {
      return NextResponse.json(
        {
          message:
            "A visit already exists for this patient on the selected date. Please edit the existing visit instead.",
          existingVisitID: existingVisit.id,
        },
        { status: 400 },
      );
    }

    const count = await Visit.countDocuments({
      visitDate: { $gte: startOfDay, $lte: endOfDay },
    });

    const tokenNumber = count + 1;

    const newVisit = await Visit.create({
      ...body,
      tokenNumber,
      status: `Waiting for Dr. ${body.doctorIDs[0]}`,
      consultations: body.doctorIDs.map((id: string) => ({
        doctorID: id,
        doctorName: id,
        status: VisitStatus.WAITING,
        prescriptions: [],
      })),
    });

    return NextResponse.json(newVisit, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
