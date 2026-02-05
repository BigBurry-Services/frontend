"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEffect, useState, use } from "react";
import axios from "axios";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Package,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { formatDate } from "@/lib/utils";

export default function MedicineDetailPage({
  params,
}: {
  params: Promise<{ medicineId: string }>;
}) {
  const { user } = useAuth();
  const { medicineId } = use(params);
  const [medicine, setMedicine] = useState<any>(null);
  const [batchFormData, setBatchFormData] = useState({
    batchNumber: "",
    quantity: "",
    expiryDate: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatchIndex, setEditingBatchIndex] = useState<number | null>(
    null,
  );

  const apiUrl = "/api";

  const fetchMedicine = async () => {
    try {
      const res = await axios.get(`${apiUrl}/inventory/${medicineId}`);
      setMedicine(res.data);
    } catch (error) {
      console.error("Failed to fetch medicine");
    }
  };

  useEffect(() => {
    fetchMedicine();
  }, [medicineId]);

  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicine) return;

    try {
      const newBatch = {
        batchNumber: batchFormData.batchNumber,
        quantity: Number(batchFormData.quantity),
        expiryDate: new Date(batchFormData.expiryDate),
        addedDate: new Date(),
      };

      let updatedBatches = [...(medicine.batches || [])];

      if (editingBatchIndex !== null) {
        // Update existing batch
        updatedBatches[editingBatchIndex] = newBatch;
      } else {
        // Add new batch
        updatedBatches.push(newBatch);
      }

      const updatedMedicine = {
        ...medicine,
        batches: updatedBatches,
      };

      await axios.patch(`${apiUrl}/inventory/${medicineId}`, updatedMedicine);
      closeModal();
      fetchMedicine();
    } catch (error) {
      alert("Failed to save batch");
    }
  };

  const handleEditBatch = (index: number) => {
    const batch = medicine.batches[index];
    setBatchFormData({
      batchNumber: batch.batchNumber,
      quantity: batch.quantity.toString(),
      expiryDate: new Date(batch.expiryDate).toISOString().split("T")[0],
    });
    setEditingBatchIndex(index);
    setIsModalOpen(true);
  };

  const handleDeleteBatch = async (index: number) => {
    if (!confirm("Are you sure you want to delete this batch?")) return;

    try {
      const updatedBatches = medicine.batches.filter(
        (_: any, i: number) => i !== index,
      );
      const updatedMedicine = {
        ...medicine,
        batches: updatedBatches,
      };

      await axios.patch(`${apiUrl}/inventory/${medicineId}`, updatedMedicine);
      fetchMedicine();
    } catch (error) {
      alert("Failed to delete batch");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBatchIndex(null);
    setBatchFormData({
      batchNumber: "",
      quantity: "",
      expiryDate: "",
    });
  };

  if (!user || (user.role !== "admin" && user.role !== "pharmacist")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalStock =
    medicine.batches?.reduce(
      (sum: number, batch: any) => sum + batch.quantity,
      0,
    ) || 0;

  return (
    <AppLayout>
      <div className="bg-slate-50/50 min-h-screen">
        <div className="bg-background border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/pharmacy/category/${medicine.categoryID}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">{medicine.name}</h1>
              <p className="text-sm text-muted-foreground">
                Total Stock: {totalStock} units
              </p>
            </div>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Batch
          </Button>
        </div>

        <main className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Batches</CardTitle>
              <CardDescription>
                Manage individual batches with expiry dates and quantities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Stock-In Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicine.batches && medicine.batches.length > 0 ? (
                    medicine.batches.map((batch: any, index: number) => {
                      const isExpired = new Date(batch.expiryDate) < new Date();
                      const isNearExpiry =
                        !isExpired &&
                        new Date(batch.expiryDate) <
                          new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {batch.batchNumber}
                          </TableCell>
                          <TableCell>{batch.quantity} units</TableCell>
                          <TableCell>{formatDate(batch.addedDate)}</TableCell>
                          <TableCell
                            className={
                              isExpired
                                ? "text-destructive font-bold"
                                : isNearExpiry
                                  ? "text-orange-600 font-semibold"
                                  : ""
                            }
                          >
                            {formatDate(batch.expiryDate)}
                            {isExpired && (
                              <span className="ml-2 text-xs">(EXPIRED)</span>
                            )}
                            {isNearExpiry && (
                              <span className="ml-2 text-xs">
                                (NEAR EXPIRY)
                              </span>
                            )}
                          </TableCell>
                          <TableCell>₹{medicine.unitPrice}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditBatch(index)}
                              >
                                <Edit2 className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteBatch(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No batches added yet</p>
                        <p className="text-sm">
                          Click "Add Batch" to add stock
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>

        {/* Add/Edit Batch Modal */}
        <Dialog open={isModalOpen} onOpenChange={closeModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingBatchIndex !== null ? "Edit Batch" : "Add New Batch"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitBatch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number</Label>
                <Input
                  id="batchNumber"
                  placeholder=""
                  value={batchFormData.batchNumber}
                  onChange={(e) =>
                    setBatchFormData({
                      ...batchFormData,
                      batchNumber: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder=""
                  value={batchFormData.quantity}
                  onChange={(e) =>
                    setBatchFormData({
                      ...batchFormData,
                      quantity: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={batchFormData.expiryDate}
                  onChange={(e) =>
                    setBatchFormData({
                      ...batchFormData,
                      expiryDate: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingBatchIndex !== null ? "Update Batch" : "Add Batch"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
