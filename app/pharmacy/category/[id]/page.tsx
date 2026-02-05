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

export default function CategoryMedicinesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, logout } = useAuth();
  const { id } = use(params);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    categoryID: id,
    unitPrice: "",
  });
  const [batchFormData, setBatchFormData] = useState({
    batchNumber: "",
    quantity: "",
    expiryDate: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const apiUrl = "/api";

  const fetchData = async () => {
    try {
      const [medRes, catRes] = await Promise.all([
        axios.get(`${apiUrl}/inventory`),
        axios.get(`${apiUrl}/categories`),
      ]);
      const categoryData = catRes.data.find((c: any) => c.id === id);
      setCategory(categoryData);
      setMedicines(medRes.data.filter((m: any) => m.categoryID === id));
    } catch (error) {
      console.error("Failed to fetch data");
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        unitPrice: Number(formData.unitPrice),
        batches: [], // New medicines start with no batches
      };

      if (isEditing) {
        await axios.patch(`${apiUrl}/inventory/${editId}`, payload);
      } else {
        await axios.post(`${apiUrl}/inventory`, payload);
      }
      closeModal();
      fetchData();
    } catch (error) {
      alert(`Failed to ${isEditing ? "update" : "add"} medicine`);
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicine) return;

    try {
      const newBatch = {
        batchNumber: batchFormData.batchNumber,
        quantity: Number(batchFormData.quantity),
        expiryDate: new Date(batchFormData.expiryDate),
        addedDate: new Date(),
      };

      const updatedMedicine = {
        ...selectedMedicine,
        batches: [...(selectedMedicine.batches || []), newBatch],
      };

      await axios.patch(
        `${apiUrl}/inventory/${selectedMedicine.id}`,
        updatedMedicine,
      );
      setIsBatchModalOpen(false);
      setSelectedMedicine(null);
      setBatchFormData({ batchNumber: "", quantity: "", expiryDate: "" });
      fetchData();
    } catch (error) {
      alert("Failed to add batch");
    }
  };

  const handleEdit = (medicine: any) => {
    setFormData({
      name: medicine.name,
      categoryID: medicine.categoryID,
      unitPrice: medicine.unitPrice.toString(),
    });
    setIsEditing(true);
    setEditId(medicine.id);
    setIsModalOpen(true);
  };

  const openBatchModal = (medicine: any) => {
    setSelectedMedicine(medicine);
    setIsBatchModalOpen(true);
  };

  const toggleRow = (medicineId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(medicineId)) {
      newExpanded.delete(medicineId);
    } else {
      newExpanded.add(medicineId);
    }
    setExpandedRows(newExpanded);
  };

  const handleDelete = async (medId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}"?`)) {
      return;
    }
    try {
      await axios.delete(`${apiUrl}/inventory/${medId}`);
      fetchData();
    } catch (error) {
      alert("Failed to remove medicine");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditId("");
    setFormData({
      name: "",
      categoryID: id,
      unitPrice: "",
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

  if (!category) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="bg-slate-50/50 min-h-screen">
        <div className="bg-background border-b px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/pharmacy">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold capitalize">
              {category.name} Catalogue
            </h1>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Medicine
            </Button>
          </div>
        </div>

        <main className="p-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Medicines in {category.name}</CardTitle>
                <CardDescription>
                  Manage inventory for this category
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData}>
                Refresh Data
              </Button>
            </CardHeader>
            <CardContent>
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine Name</TableHead>
                        <TableHead>Total Stock</TableHead>
                        <TableHead>Batches</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicines.map((m: any) => {
                        const totalStock =
                          m.batches?.reduce(
                            (sum: number, batch: any) => sum + batch.quantity,
                            0,
                          ) || 0;
                        const batchCount = m.batches?.length || 0;
                        const hasExpiredBatch = m.batches?.some(
                          (b: any) => new Date(b.expiryDate) < new Date(),
                        );

                        return (
                          <TableRow key={m.id}>
                            <TableCell>
                              <Link
                                href={`/pharmacy/medicine/${m.id}`}
                                className="font-medium hover:text-primary hover:underline cursor-pointer"
                              >
                                {m.name}
                              </Link>
                              {hasExpiredBatch && (
                                <span className="ml-2 text-[10px] text-destructive font-bold uppercase tracking-tighter">
                                  Has Expired
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  totalStock === 0
                                    ? "text-destructive font-bold"
                                    : ""
                                }
                              >
                                {totalStock} units
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {batchCount}{" "}
                              {batchCount === 1 ? "batch" : "batches"}
                            </TableCell>
                            <TableCell>₹{m.unitPrice}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(m)}
                                >
                                  <Edit2 className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(m.id, m.name)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {medicines.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-12 text-muted-foreground"
                          >
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <Package className="h-8 w-8 opacity-20" />
                              <p>No medicines found in this category.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {medicines.length > 0 ? (
                    medicines.map((m: any) => {
                      const totalStock =
                        m.batches?.reduce(
                          (sum: number, batch: any) => sum + batch.quantity,
                          0,
                        ) || 0;
                      const batchCount = m.batches?.length || 0;
                      const hasExpiredBatch = m.batches?.some(
                        (b: any) => new Date(b.expiryDate) < new Date(),
                      );

                      return (
                        <Card key={m.id} className="overflow-hidden">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <Link
                                  href={`/pharmacy/medicine/${m.id}`}
                                  className="font-bold text-lg hover:text-primary transition-colors"
                                >
                                  {m.name}
                                </Link>
                                {hasExpiredBatch && (
                                  <div className="mt-1">
                                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                      Has Expired Batch
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-lg">
                                  ₹{m.unitPrice}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  per unit
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                              <div>
                                <span className="text-xs text-muted-foreground block">
                                  Stock
                                </span>
                                <span
                                  className={`font-semibold ${totalStock === 0 ? "text-destructive" : ""}`}
                                >
                                  {totalStock} units
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground block">
                                  Batches
                                </span>
                                <span className="font-semibold">
                                  {batchCount}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                className="flex-1 h-9 text-xs"
                                onClick={() => handleEdit(m)}
                              >
                                <Edit2 className="h-3 w-3 mr-2 text-blue-500" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 h-9 text-xs hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                                onClick={() => handleDelete(m.id, m.name)}
                              >
                                <Trash2 className="h-3 w-3 mr-2 text-red-500" />
                                Remove
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                      <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p>No medicines found.</p>
                    </div>
                  )}
                </div>
              </>
            </CardContent>
          </Card>
        </main>

        {/* Medicine Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditing
                  ? "Update Medicine Details"
                  : "Register New Medicine"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Medicine Name</Label>
                <Input
                  id="name"
                  placeholder=""
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Unit Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder=""
                  value={formData.unitPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, unitPrice: e.target.value })
                  }
                  required
                />
              </div>

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditing ? "Save Changes" : "Register Item"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
