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

    const filter: any = {};
    if (doctorID) filter.doctorIDs = doctorID;
    if (patientID) filter.patientID = patientID;

    const visits = await Visit.find(filter).sort({ tokenNumber: 1 });
    return NextResponse.json(visits);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/visits
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const count = await Visit.countDocuments({
      visitDate: { $gte: startOfDay, $lte: endOfDay },
    });

    const tokenNumber = count + 1;

    const newVisit = new Visit({
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

    await newVisit.save();
    return NextResponse.json(newVisit, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
