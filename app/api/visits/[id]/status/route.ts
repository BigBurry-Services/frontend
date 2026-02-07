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
          { message: "Consultation not found for this doctor" },
          { status: 404 },
        );
      }

      visit.consultations[consultationIndex].status = status;
      if (notes) visit.consultations[consultationIndex].notes = notes;
      if (prescriptions)
        visit.consultations[consultationIndex].prescriptions = prescriptions;
      if (services) visit.consultations[consultationIndex].services = services;

      // Dynamic Status Logic - Complete Workflow
      if (status === VisitStatus.IN_CONSULTATION) {
        // Patient is currently consulting with this doctor
        visit.status = `Consulting with Dr. ${doctorID}`;
      } else if (status === VisitStatus.COMPLETED) {
        // This doctor's consultation is complete, determine next step
        const allCompleted = visit.consultations.every(
          (c) => c.status === VisitStatus.COMPLETED,
        );

        if (allCompleted) {
          // All consultations complete - check if there are prescriptions or services
          const hasPrescriptions = visit.consultations.some(
            (c) => c.prescriptions && c.prescriptions.length > 0,
          );
          const hasServices = visit.consultations.some(
            (c) => c.services && c.services.length > 0,
          );

          if (hasPrescriptions) {
            visit.status = "Waiting for Medicine";
          } else if (hasServices) {
            visit.status = "Waiting for Payment";
          } else {
            visit.status = "Waiting for Payment";
          }
        } else {
          // More consultations pending - find next waiting doctor
          const nextWaiting = visit.consultations.find(
            (c) => c.status === VisitStatus.WAITING,
          );
          if (nextWaiting) {
            visit.status = `Waiting for Dr. ${nextWaiting.doctorName}`;
          }
        }
      }

      await visit.save();
      return NextResponse.json(visit);
    }

    // Legacy fallback or generic update
    const updatedVisit = await Visit.findByIdAndUpdate(
      id,
      { status, notes, prescriptions },
      { new: true },
    );

    return NextResponse.json(updatedVisit);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
