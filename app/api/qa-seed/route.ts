import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import Department from "@/models/Department";
import Category from "@/models/Category";
import Inventory from "@/models/Inventory";
import User, { UserRole } from "@/models/User";
import Patient from "@/models/Patient";
import Resource from "@/models/Resource";
import Visit, { VisitStatus } from "@/models/Visit";
import Service from "@/models/Service";

export async function GET() {
  try {
    const DATA_DIR = path.join(process.cwd(), "data");

    // 1. Clear existing data
    try {
      const files = await fs.readdir(DATA_DIR);
      for (const file of files) {
        if (file.endsWith(".json")) {
          await fs.unlink(path.join(DATA_DIR, file));
        }
      }
    } catch (e) {
      // Directory usually created by JsonStorage on first write
    }

    // 2. Add Users
    const admin = await User.create({
      username: "admin",
      password: "password",
      role: UserRole.ADMIN,
      name: "Super Admin",
    });

    const recep = await User.create({
      username: "reception",
      password: "password",
      role: UserRole.RECEPTIONIST,
      name: "Alice Receptionist",
    });

    const pharma = await User.create({
      username: "pharma",
      password: "password",
      role: UserRole.PHARMACIST,
      name: "Bob Pharmacist",
    });

    // 3. Add Departments
    const deptGen = await Department.create({
      name: "General Medicine",
      description: "General health issues",
    });
    const deptOrtho = await Department.create({
      name: "Orthopedics",
      description: "Bone and joint care",
    });
    const deptPeds = await Department.create({
      name: "Pediatrics",
      description: "Child care",
    });

    // 4. Add Doctors (linked to Departments)
    const doc1 = await User.create({
      username: "doc_gen",
      password: "password",
      role: UserRole.DOCTOR,
      name: "Dr. Smith",
      department: deptGen.name,
      specialization: "General Physician",
      consultationFee: 500,
    });

    const doc2 = await User.create({
      username: "doc_ortho",
      password: "password",
      role: UserRole.DOCTOR,
      name: "Dr. Jones",
      department: deptOrtho.name,
      specialization: "Orthopedic Surgeon",
      consultationFee: 800,
    });

    // 5. Add Patients
    const pat1 = await Patient.create({
      patientID: "P-1001",
      name: "John Doe",
      age: 35,
      gender: "Male",
      mobile: "9876543210",
      address: "123 Main St",
    });

    const pat2 = await Patient.create({
      patientID: "P-1002",
      name: "Jane Roe",
      age: 28,
      gender: "Female",
      mobile: "9876543211",
      address: "456 Oak Ave",
    });

    const pat3 = await Patient.create({
      patientID: "P-1003",
      name: "Baby Mike",
      age: 4,
      gender: "Male",
      mobile: "9876543212",
      guardianName: "Mike Parent",
      address: "789 Pine Ln",
    });

    // 6. Add Categories & Inventory
    const catTab = await Category.create({ name: "Tablets" });
    const catSyr = await Category.create({ name: "Syrups" });

    await Inventory.create({
      name: "Paracetamol 500mg",
      categoryID: catTab.id,
      unitPrice: 5,
      batches: [
        {
          batchNumber: "B001",
          quantity: 100,
          expiryDate: new Date("2025-12-31"),
          addedDate: new Date(),
        },
      ],
    });
    await Inventory.create({
      name: "Amoxicillin 250mg",
      categoryID: catTab.id,
      unitPrice: 10,
      batches: [
        {
          batchNumber: "B002",
          quantity: 50,
          expiryDate: new Date("2025-10-31"),
          addedDate: new Date(),
        },
      ],
    });
    await Inventory.create({
      name: "Cough Syrup 100ml",
      categoryID: catSyr.id,
      unitPrice: 85,
      batches: [
        {
          batchNumber: "B003",
          quantity: 30,
          expiryDate: new Date("2026-06-30"),
          addedDate: new Date(),
        },
      ],
    });
    await Inventory.create({
      name: "Vitamin C",
      categoryID: catTab.id,
      unitPrice: 3,
      batches: [
        {
          batchNumber: "B004",
          quantity: 200,
          expiryDate: new Date("2025-08-31"),
          addedDate: new Date(),
        },
      ],
    });

    // 7. Add Resources (Beds)
    await Resource.create({
      resourceID: "BED-001",
      name: "Bed 1",
      type: "General Ward",
      isOccupied: false,
    });
    await Resource.create({
      resourceID: "BED-002",
      name: "Bed 2",
      type: "General Ward",
      isOccupied: false,
    });
    await Resource.create({
      resourceID: "ICU-001",
      name: "ICU 1",
      type: "ICU",
      isOccupied: false,
    });

    // 8. Add Services
    await Service.create({
      name: "X-Ray",
      price: 1000,
      description: "Chest X-Ray",
    });
    await Service.create({
      name: "Blood Test",
      price: 500,
      description: "Complete Blood Count",
    });

    // 9. Add Visits
    // Visit 1: Active, Waiting for Doctor
    await Visit.create({
      tokenNumber: 1,
      patientID: pat1.patientID,
      doctorIDs: [doc1.id],
      status: VisitStatus.WAITING,
      paymentStatus: "pending",
      visitDate: new Date(),
      prescriptions: [],
      consultations: [
        {
          doctorID: doc1.id,
          doctorName: doc1.name,
          status: VisitStatus.WAITING,
          notes: "",
          prescriptions: [],
          services: [],
        },
      ],
    });

    // Visit 2: Completed, Waiting for Payment
    await Visit.create({
      tokenNumber: 2,
      patientID: pat2.patientID,
      doctorIDs: [doc1.id],
      status: VisitStatus.WAITING_FOR_PAYMENT,
      paymentStatus: "pending",
      visitDate: new Date(),
      prescriptions: [
        {
          name: "Paracetamol 500mg",
          dosage: "1-0-1",
          instruction: "After food",
        },
      ],
      consultations: [
        {
          doctorID: doc1.id,
          doctorName: doc1.name,
          status: VisitStatus.COMPLETED,
          notes: "Patient has viral fever.",
          prescriptions: [
            {
              name: "Paracetamol 500mg",
              dosage: "1-0-1",
              instruction: "After food",
              quantity: 10,
            },
          ],
          services: [{ name: "Blood Test", price: 500 }],
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Database Seeded Successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
