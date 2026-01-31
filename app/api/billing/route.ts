import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import Visit from "@/models/Visit";
import User from "@/models/User";
import Inventory from "@/models/Inventory";

// Helper to get pending dues (ported from NestJS BillingService)
async function getPendingDues(patientID: string) {
  const invoices = await Invoice.find({ patientID });
  const paidByVisitKeys = new Set<string>();
  const paidGenericCounts = new Map<string, number>();

  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      if (item.visitID) {
        paidByVisitKeys.add(
          `${item.visitID}-${item.description}-${item.amount}`,
        );
      } else {
        const key = `${item.description}-${item.amount}`;
        paidGenericCounts.set(key, (paidGenericCounts.get(key) || 0) + 1);
      }
    });
  });

  const pendingVisits = await Visit.find({
    patientID,
    status: { $ne: "cancelled" },
    paymentStatus: { $ne: "paid" },
  });

  const dueItems: any[] = [];

  for (const visit of pendingVisits) {
    const potentialItems: any[] = [];

    // A. Consultation Charges
    if (visit.consultations && visit.consultations.length > 0) {
      for (const consultation of visit.consultations) {
        const doctor = await User.findOne({ username: consultation.doctorID });
        if (doctor && doctor.consultationFee) {
          potentialItems.push({
            description: `Consultation: Dr. ${doctor.name}`,
            amount: doctor.consultationFee,
            visitID: (visit._id as any).toString(),
          });
        }
      }
    }

    // B. Medicine Charges
    if (visit.consultations) {
      for (const c of visit.consultations) {
        if (c.prescriptions) {
          for (const p of c.prescriptions) {
            const medicine = await Inventory.findOne({ name: p.name });
            if (medicine) {
              const quantity = p.quantity || 1;
              potentialItems.push({
                description: `Medicine: ${p.name} (x${quantity})`,
                amount: medicine.unitPrice * quantity,
                visitID: (visit._id as any).toString(),
              });
            }
          }
        }
      }
    }

    // Filter out paid items
    for (const item of potentialItems) {
      const strictKey = `${item.visitID}-${item.description}-${item.amount}`;
      const genericKey = `${item.description}-${item.amount}`;

      if (paidByVisitKeys.has(strictKey)) {
        continue;
      } else if ((paidGenericCounts.get(genericKey) || 0) > 0) {
        paidGenericCounts.set(
          genericKey,
          paidGenericCounts.get(genericKey)! - 1,
        );
        continue;
      }

      dueItems.push(item);
    }
  }

  return dueItems;
}

// GET /api/billing
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const patientID = searchParams.get("patientID");
    const type = searchParams.get("type"); // 'dues' or 'summary'

    if (patientID) {
      if (type === "dues") {
        const dues = await getPendingDues(patientID);
        return NextResponse.json(dues);
      }

      const invoices = await Invoice.find({ patientID }).sort({
        createdAt: -1,
      });
      const totalPaid = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const pendingItems = await getPendingDues(patientID);
      const totalPending = pendingItems.reduce(
        (sum, item) => sum + item.amount,
        0,
      );

      return NextResponse.json({
        totalPaid,
        totalPending,
        recentInvoices: invoices.slice(0, 5),
      });
    }

    const invoices = await Invoice.find().sort({ createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/billing
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const items = body.items || [];
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.amount,
      0,
    );

    const newInvoice = new Invoice({
      ...body,
      invoiceNumber,
      totalAmount,
    });

    const savedInvoice = await newInvoice.save();

    // Check for visits where ALL items are now paid
    const visitIDs = Array.from(
      new Set(items.map((i: any) => i.visitID).filter((id: any) => !!id)),
    ) as string[];

    for (const visitID of visitIDs) {
      const remainingDues = await getPendingDues(body.patientID);
      const duesForVisit = remainingDues.filter((d) => d.visitID === visitID);

      if (duesForVisit.length === 0) {
        await Visit.findByIdAndUpdate(visitID, {
          paymentStatus: "paid",
          status: "Completed",
        });
      }
    }

    return NextResponse.json(savedInvoice, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
