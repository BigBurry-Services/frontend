import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Visit from "@/models/Visit";
import Patient from "@/models/Patient";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Fetch all related data
    const visits = await Visit.find({});
    const patients = await Patient.find({});
    // We might need to fetch doctors (Users) to map IDs to Names, or rely on doctorName in consultations
    // Visit model has doctorIDs and consultations[{doctorName}]

    // Helper to find patient name
    const getPatientName = (id: string) => {
      const p = patients.find((pat: any) => pat.patientID === id);
      return p ? p.name : id;
    };

    const reportData = visits.map((visit: any) => {
      // Collect all doctor names encountered
      const doctorNames = new Set<string>();
      if (visit.consultations && visit.consultations.length > 0) {
        visit.consultations.forEach((c: any) => {
          if (c.doctorName) doctorNames.add(c.doctorName);
        });
      }

      return {
        id: visit.id,
        visitDate: visit.visitDate,
        createdAt: visit.createdAt,
        patientName: getPatientName(visit.patientID),
        patientID: visit.patientID,
        doctorNames: Array.from(doctorNames).join(", "),
        status: visit.status,
        token: visit.tokenNumber,
      };
    });

    // Sort by date desc
    reportData.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json(reportData);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
