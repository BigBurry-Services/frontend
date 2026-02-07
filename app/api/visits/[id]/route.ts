import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Visit, { VisitStatus } from "@/models/Visit";

// GET /api/visits/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const visit = await Visit.findOne({ id });

    if (!visit) {
      return NextResponse.json({ message: "Visit not found" }, { status: 404 });
    }

    return NextResponse.json(visit);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PATCH /api/visits/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const visit = await Visit.findOne({ id });

    if (!visit) {
      return NextResponse.json({ message: "Visit not found" }, { status: 404 });
    }

    // Update basic fields
    if (body.patientID) visit.patientID = body.patientID;
    if (body.visitDate) visit.visitDate = new Date(body.visitDate);
    if (body.reason !== undefined) visit.reason = body.reason;
    if (body.status !== undefined) visit.status = body.status;

    // Handle doctor changes
    if (body.doctorIDs && Array.isArray(body.doctorIDs)) {
      visit.doctorIDs = body.doctorIDs;

      // Rebuild consultations array based on new doctors
      const existingConsultations = visit.consultations || [];
      const newConsultations = body.doctorIDs.map((doctorID: string) => {
        // Keep existing consultation if doctor was already assigned
        const existing = existingConsultations.find(
          (c: any) => c.doctorID === doctorID,
        );
        if (existing) {
          return existing;
        }
        // Create new consultation for newly added doctor
        return {
          doctorID,
          doctorName: doctorID,
          status: VisitStatus.WAITING,
          prescriptions: [],
          services: [],
        };
      });

      visit.consultations = newConsultations;

      // Update visit status based on consultations
      const firstWaiting = newConsultations.find(
        (c: any) => c.status === VisitStatus.WAITING,
      );
      const firstInConsultation = newConsultations.find(
        (c: any) => c.status === VisitStatus.IN_CONSULTATION,
      );

      if (firstInConsultation) {
        visit.status = `Consulting with Dr. ${firstInConsultation.doctorID}`;
      } else if (firstWaiting) {
        visit.status = `Waiting for Dr. ${firstWaiting.doctorID}`;
      }
    }

    const updatedVisit = await Visit.findByIdAndUpdate(id, visit, {
      new: true,
    }).lean();
    return NextResponse.json(updatedVisit);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE /api/visits/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;

    await Visit.findByIdAndDelete(id);
    return NextResponse.json({ message: "Visit deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
