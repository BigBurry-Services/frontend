import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Patient from "@/models/Patient";
import fs from "fs/promises";
import path from "path";

const UPLOAD_BASE = path.join(process.cwd(), "public", "uploads", "patients");

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 },
      );
    }

    await dbConnect();
    const patient =
      (await Patient.findOne({ patientID: id })) ||
      (await Patient.findById(id));
    if (!patient) {
      return NextResponse.json(
        { message: "Patient not found" },
        { status: 404 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const patientUploadDir = path.join(
      UPLOAD_BASE,
      patient.id || patient._id.toString(),
    );
    await fs.mkdir(patientUploadDir, { recursive: true });

    // Sanitize filename: remove original path separators and other potentially problematic characters for Windows
    const sanitizedOriginalName = file.name
      .replace(/[\\/:*?"<>|]/g, "_") // Remove Windows illegal chars
      .replace(/\s+/g, "_");
    const fileName = `${Date.now()}-${sanitizedOriginalName}`;
    const filePath = path.join(patientUploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/patients/${patient.id || patient._id.toString()}/${fileName}`;

    const newDoc = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      url: fileUrl,
      size: file.size,
      uploadedAt: new Date(),
    };

    // Use findOneAndUpdate with $push for atomic and reliable update
    const updatedPatient = await Patient.findOneAndUpdate(
      { _id: patient._id },
      { $push: { documents: newDoc } },
      { new: true },
    );

    if (!updatedPatient) {
      throw new Error("Failed to update patient documents");
    }

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error: any) {
    console.error("DEBUG: POST /api/patients/[id]/documents error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error during upload" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("docId");

    if (!docId) {
      return NextResponse.json(
        { message: "Document ID required" },
        { status: 400 },
      );
    }

    await dbConnect();
    const patient =
      (await Patient.findOne({ patientID: id })) ||
      (await Patient.findById(id));
    if (!patient) {
      return NextResponse.json(
        { message: "Patient not found" },
        { status: 404 },
      );
    }

    const documents = patient.documents || [];
    const docIndex = documents.findIndex((d: any) => d.id === docId);

    if (docIndex === -1) {
      return NextResponse.json(
        { message: "Document not found" },
        { status: 404 },
      );
    }

    const doc = documents[docIndex];

    // Try to delete the physical file
    try {
      const filePath = path.join(process.cwd(), "public", doc.url);
      await fs.unlink(filePath);
    } catch (e) {
      console.error("Failed to delete physical file:", e);
    }

    documents.splice(docIndex, 1);
    patient.documents = documents;
    await patient.save();

    return NextResponse.json({ message: "Document deleted" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
