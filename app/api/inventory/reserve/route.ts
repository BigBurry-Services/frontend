import { NextRequest, NextResponse } from "next/server";
import Inventory from "@/models/Inventory";

export async function POST(request: NextRequest) {
  try {
    const { prescriptions } = await request.json();

    if (!prescriptions || !Array.isArray(prescriptions)) {
      return NextResponse.json(
        { error: "Prescriptions array required" },
        { status: 400 },
      );
    }

    const allInventory = await Inventory.find({});
    const updates: any[] = [];

    // Process each prescription and reduce stock temporarily
    for (const prescription of prescriptions) {
      const medicineName = prescription.name;
      const requiredQuantity = prescription.quantity || 0;

      if (requiredQuantity === 0) continue;

      // Find matching medicine
      const medicine = allInventory.find(
        (inv: any) => inv.name.toLowerCase() === medicineName.toLowerCase(),
      );

      if (!medicine) continue;

      // Get available batches (non-expired, sorted by addedDate - FIFO)
      const now = new Date();
      const availableBatches = (medicine.batches || [])
        .filter(
          (batch: any) =>
            new Date(batch.expiryDate) > now && batch.quantity > 0,
        )
        .sort(
          (a: any, b: any) =>
            new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime(),
        );

      // Calculate total available stock
      const totalAvailable = availableBatches.reduce(
        (sum: number, batch: any) => sum + batch.quantity,
        0,
      );

      if (totalAvailable < requiredQuantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${medicineName}` },
          { status: 400 },
        );
      }

      // Deduct from batches using FIFO
      let remainingToDeduct = requiredQuantity;
      const updatedBatches = medicine.batches
        .map((batch: any) => {
          if (remainingToDeduct <= 0) return batch;
          if (new Date(batch.expiryDate) <= now) return batch;
          if (batch.quantity <= 0) return batch;

          const deductAmount = Math.min(batch.quantity, remainingToDeduct);
          remainingToDeduct -= deductAmount;

          return {
            ...batch,
            quantity: batch.quantity - deductAmount,
          };
        })
        .filter((batch: any) => batch.quantity > 0);

      updates.push({
        id: medicine.id,
        data: {
          ...medicine,
          batches: updatedBatches,
        },
      });
    }

    // Apply all inventory updates
    for (const update of updates) {
      await Inventory.update(update.id, update.data);
    }

    return NextResponse.json({
      success: true,
      message: "Stock reserved successfully",
    });
  } catch (error) {
    console.error("Reserve stock error:", error);
    return NextResponse.json(
      { error: "Failed to reserve stock" },
      { status: 500 },
    );
  }
}
