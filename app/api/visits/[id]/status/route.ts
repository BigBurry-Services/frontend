import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Visit, { VisitStatus } from "@/models/Visit";

// PATCH /api/visits/[id]/status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const { status, notes, prescriptions, services, doctorID } =
      await req.json();

    const visit = await Visit.findById(id);

    if (!visit) {
      return NextResponse.json({ message: "Visit not found" }, { status: 404 });
    }

    if (doctorID) {
      // Update the specific consultation in the array
      const consultationIndex = visit.consultations.findIndex(
        (c) => c.doctorID === doctorID,
      );
      if (consultationIndex === -1) {
        return NextResponse.json(
          { message: "Consultation not found" },
          { status: 404 },
        );
      }

      visit.consultations[consultationIndex].status = status;
      if (notes) visit.consultations[consultationIndex].notes = notes;
      if (prescriptions)
        visit.consultations[consultationIndex].prescriptions = prescriptions;
      if (services) visit.consultations[consultationIndex].services = services;

      // Dynamic Status Logic
      if (status === VisitStatus.IN_CONSULTATION) {
        visit.status = `Consulting with Dr. ${doctorID}`;
      } else if (status === VisitStatus.COMPLETED) {
        const allCompleted = visit.consultations.every(
          (c) => c.status === VisitStatus.COMPLETED,
        );
        if (allCompleted) {
          visit.status = "Waiting at Reception";
        } else {
          const nextWaiting = visit.consultations.find(
            (c) => c.status === VisitStatus.WAITING,
          );
          if (nextWaiting) {
            visit.status = `Waiting for Dr. ${nextWaiting.doctorName}`;
          }
        }
      }

      await Visit.update(id, visit);
      return NextResponse.json(visit);
    }

    // Legacy fallback or generic update
    const updatedVisit = await Visit.update(id, {
      status,
      notes,
      prescriptions,
    });

    return NextResponse.json(updatedVisit);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
