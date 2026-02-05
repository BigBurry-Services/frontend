"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppLayout } from "@/components/AppLayout";
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
  Search,
  Plus,
  Pill,
  AlertTriangle,
  ChevronRight,
  Package,
  AlertCircle,
  Download,
  Upload,
} from "lucide-react";
import { useRef } from "react";
import { formatDate } from "@/lib/utils";

export default function PharmacyDashboard() {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientQueue, setPatientQueue] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiUrl = "/api";

  const fetchData = async () => {
    try {
      const [catRes, medRes, visitsRes, patientsRes] = await Promise.all([
        axios.get(`${apiUrl}/categories`),
        axios.get(`${apiUrl}/inventory`),
        axios.get(`${apiUrl}/visits`),
        axios.get(`${apiUrl}/patients`),
      ]);
      setCategories(catRes.data);
      setMedicines(medRes.data);
      setPatients(patientsRes.data);

      // Filter visits with "Waiting for Medicine" status
      const waitingForMedicine = visitsRes.data.filter(
        (v: any) => v.status === "Waiting for Medicine",
      );
      setPatientQueue(waitingForMedicine);
    } catch (error) {
      console.error("Failed to fetch data");
    }
  };

  const handleDispenseMedicine = async (visitId: string) => {
    try {
      // Get the visit to extract prescriptions
      const visitRes = await axios.get(`${apiUrl}/visits/${visitId}`);
      const visit = visitRes.data;

      // Collect all prescriptions from all consultations
      const allPrescriptions: any[] = [];
      visit.consultations?.forEach((consultation: any) => {
        consultation.prescriptions?.forEach((prescription: any) => {
          allPrescriptions.push(prescription);
        });
      });

      // Get all inventory items
      const inventoryRes = await axios.get(`${apiUrl}/inventory`);
      const allInventory = inventoryRes.data;

      // Process each prescription and reduce stock
      const stockErrors: string[] = [];
      const inventoryUpdates: any[] = [];

      for (const prescription of allPrescriptions) {
        const medicineName = prescription.name;
        const requiredQuantity = prescription.quantity || 0;

        if (requiredQuantity === 0) continue;

        // Find matching medicine in inventory (case-insensitive)
        const medicine = allInventory.find(
          (inv: any) => inv.name.toLowerCase() === medicineName.toLowerCase(),
        );

        if (!medicine) {
          stockErrors.push(`${medicineName}: Not found in inventory`);
          continue;
        }

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
          stockErrors.push(
            `${medicineName}: Insufficient stock (need ${requiredQuantity}, have ${totalAvailable})`,
          );
          continue;
        }

        // Deduct from batches using FIFO
        let remainingToDeduct = requiredQuantity;
        const updatedBatches = medicine.batches
          .map((batch: any) => {
            if (remainingToDeduct <= 0) return batch;
            if (new Date(batch.expiryDate) <= now) return batch; // Skip expired
            if (batch.quantity <= 0) return batch; // Skip empty

            const deductAmount = Math.min(batch.quantity, remainingToDeduct);
            remainingToDeduct -= deductAmount;

            return {
              ...batch,
              quantity: batch.quantity - deductAmount,
            };
          })
          .filter((batch: any) => batch.quantity > 0); // Remove empty batches

        // Store update for this medicine
        inventoryUpdates.push({
          id: medicine.id,
          data: {
            ...medicine,
            batches: updatedBatches,
          },
        });
      }

      // If there are stock errors, show them and abort
      if (stockErrors.length > 0) {
        alert("Cannot dispense medicines:\n\n" + stockErrors.join("\n"));
        return;
      }

      // Apply all inventory updates
      for (const update of inventoryUpdates) {
        await axios.patch(`${apiUrl}/inventory/${update.id}`, update.data);
      }

      // Update visit status to "Waiting for Payment"
      await axios.patch(`${apiUrl}/visits/${visitId}`, {
        ...visit,
        status: "Waiting for Payment",
      });

      setSelectedPatient(null);
      fetchData(); // Refresh the queue
      alert(
        "Medicines dispensed successfully! Stock updated. Patient moved to payment queue.",
      );
    } catch (error) {
      console.error("Dispense error:", error);
      alert("Failed to dispense medicines");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await axios.post(`${apiUrl}/categories`, {
        name: newCategoryName,
      });
      setNewCategoryName("");
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Failed to add category");
    }
  };

  const exportInventoryToCSV = () => {
    const headers = [
      "ID",
      "Medicine Name",
      "Category",
      "Batch Number",
      "Stock",
      "Unit Price",
      "Expiry Date",
    ];
    const csvData = medicines.map((m) => {
      const category =
        categories.find((c) => c.id === m.categoryID)?.name || "Uncategorized";
      const totalStock =
        m.batches?.reduce((sum: number, b: any) => sum + b.quantity, 0) || 0;
      return [
        m.id,
        `"${m.name}"`,
        `"${category}"`,
        `"${m.batchNumber || ""}"`,
        totalStock,
        m.unitPrice,
        formatDate(m.expiryDate),
      ].join(",");
    });

    const csvString = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Pharmacy_Inventory_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("Are you sure you want to import medicines from this CSV?"))
      return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      // Skip header
      const dataLines = lines.slice(1).filter((line) => line.trim() !== "");

      let errorCount = 0;

      for (const line of dataLines) {
        const parts = line.split(",").map((f) => f.replace(/"/g, "").trim());
        if (parts.length < 5) continue;

        const [
          ,
          name,
          categoryName,
          batchNumber,
          stock,
          unitPrice,
          expiryDate,
        ] = parts;

        let targetCategoryID = categories.find(
          (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
        )?.id;

        // If category doesn't exist, create it or use "General"
        if (!targetCategoryID) {
          try {
            const newCat = await axios.post(`${apiUrl}/categories`, {
              name: categoryName || "General",
            });
            targetCategoryID = newCat.data.id;
            // Refresh local categories to avoid duplicates in the same import run
            const updatedCats = await axios.get(`${apiUrl}/categories`);
            setCategories(updatedCats.data);
          } catch (err) {
            continue;
          }
        }

        try {
          // Standard inventory payload (Note: Backend structure might vary, adapting to common pattern)
          await axios.post(`${apiUrl}/inventory`, {
            name,
            categoryID: targetCategoryID,
            batchNumber,
            quantity: Number(stock),
            unitPrice: Number(unitPrice),
            expiryDate: new Date(expiryDate).toISOString(),
          });
        } catch (err) {
          errorCount++;
        }
      }

      alert(`Import completed! Errors: ${errorCount}. Refreshing inventory...`);
      fetchData();
    };
    reader.readAsText(file);
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

  const nearExpiryMedicines = medicines.filter((m: any) => {
    if (!m.batches || m.batches.length === 0) return false;
    const now = new Date();
    const twoMonthsFromNow = new Date(
      now.getFullYear(),
      now.getMonth() + 2,
      now.getDate(),
    );

    // Check if any batch is near expiry
    return m.batches.some((batch: any) => {
      if (!batch.expiryDate) return false;
      const expiry = new Date(batch.expiryDate);
      return expiry >= now && expiry <= twoMonthsFromNow;
    });
  });

  const filteredMedicines = searchTerm.trim()
    ? medicines.filter(
        (m: any) =>
          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (m.batchNumber &&
            m.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    : [];

  return (
    <AppLayout>
      <div className="flex flex-col h-full space-y-6 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Pharmacy Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage inventory, categories, and track expirations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex-1 md:flex-none border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleImportCSV}
            />
            <Button
              onClick={exportInventoryToCSV}
              variant="outline"
              className="flex-1 md:flex-none border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Patient Queue Section */}
        {patientQueue.length > 0 && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Patients Waiting for Medicine ({patientQueue.length})
              </CardTitle>
              <CardDescription>
                Click on a patient to view prescribed medications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patientQueue.map((visit: any) => {
                  const patient = patients.find(
                    (p) => p.patientID === visit.patientID,
                  );
                  const allPrescriptions =
                    visit.consultations?.flatMap(
                      (c: any) => c.prescriptions || [],
                    ) || [];

                  return (
                    <Card
                      key={visit.id}
                      className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-primary"
                      onClick={() => setSelectedPatient({ visit, patient })}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block mb-1">
                              Token #{visit.tokenNumber}
                            </p>
                            <h3 className="font-bold text-lg">
                              {patient?.name || visit.patientID}
                            </h3>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>Patient ID: {visit.patientID}</p>
                          <p>Prescriptions: {allPrescriptions.length} items</p>
                          <p className="text-xs">
                            Date: {formatDate(visit.visitDate)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Section */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medicines by name or batch number..."
            className="pl-9 h-12 text-lg bg-background shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Search Results */}
        {searchTerm.trim() !== "" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Search Results ({filteredMedicines.length})
              </h2>
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </Button>
            </div>

            {filteredMedicines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMedicines.map((m: any) => {
                  const category = categories.find(
                    (c) => c.id === m.categoryID,
                  );
                  return (
                    <Link
                      key={m.id}
                      href={`/pharmacy/category/${m.categoryID}`}
                      className="group block"
                    >
                      <Card className="hover:shadow-md transition-all border-l-4 border-l-primary/20 hover:border-l-primary">
                        <CardContent className="p-4 flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors capitalize">
                              {m.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="text-xs bg-muted px-2 py-1 rounded-md font-medium uppercase tracking-wider">
                                {category?.name || "Uncategorized"}
                              </span>
                              {m.batchNumber && (
                                <span className="text-xs text-muted-foreground">
                                  #{m.batchNumber}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">₹{m.unitPrice}</p>
                            <p
                              className={`text-xs mt-1 ${
                                new Date(m.expiryDate) < new Date()
                                  ? "text-destructive font-bold"
                                  : "text-muted-foreground"
                              }`}
                            >
                              Exp: {formatDate(m.expiryDate)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No medicines found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        )}

        {/* Near Expiry Alert Section */}
        {nearExpiryMedicines.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-amber-900">Expiry Alerts</CardTitle>
              </div>
              <CardDescription className="text-amber-700">
                Medicines expiring within the next 2 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {nearExpiryMedicines.map((m: any) => (
                  <div
                    key={m.id}
                    className="bg-white border border-amber-100 rounded-lg p-3 flex justify-between items-center shadow-sm"
                  >
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">
                        {m.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {categories.find((c: any) => c.id === m.categoryID)
                          ?.name || "Uncategorized"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-amber-600">
                        {formatDate(m.expiryDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Medicine Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((cat: any) => {
              const count = medicines.filter(
                (m) => m.categoryID === cat.id,
              ).length;
              return (
                <Link
                  key={cat.id}
                  href={`/pharmacy/category/${cat.id}`}
                  className="group block"
                >
                  <Card className="hover:shadow-lg transition-all border-t-4 border-t-transparent hover:border-t-primary">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Pill className="h-6 w-6" />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold mb-1 capitalize">
                        {cat.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {count} Medicines
                      </p>
                      <div className="mt-4 flex items-center text-primary font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        View Catalogue
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}

            <Button
              variant="outline"
              className="h-auto flex flex-col items-center justify-center p-6 border-dashed border-2 hover:border-primary hover:bg-primary/5 gap-2"
              onClick={() => setIsModalOpen(true)}
            >
              <div className="p-4 rounded-full bg-muted group-hover:bg-background transition-colors">
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
              </div>
              <span className="font-semibold text-sm">Add New Category</span>
            </Button>
          </div>

          {categories.length === 0 && (
            <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed">
              <div className="mb-4 inline-flex p-4 bg-muted rounded-full text-muted-foreground">
                <Package className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Categories Yet</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mb-6">
                Create your first category to start organizing your medicine
                catalogue.
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                Create Category
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                placeholder="e.g. Antibiotics"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Prescription Details Modal */}
      {selectedPatient && (
        <Dialog
          open={!!selectedPatient}
          onOpenChange={() => setSelectedPatient(null)}
        >
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Prescribed Medications</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Patient Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Patient Name</p>
                      <p className="font-semibold">
                        {selectedPatient.patient?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Patient ID</p>
                      <p className="font-semibold">
                        {selectedPatient.visit?.patientID}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Token Number</p>
                      <p className="font-semibold">
                        #{selectedPatient.visit?.tokenNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Visit Date</p>
                      <p className="font-semibold">
                        {formatDate(selectedPatient.visit?.visitDate)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Prescriptions */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Prescribed Medicines</h3>
                <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                  {selectedPatient.visit?.consultations?.map(
                    (consultation: any, idx: number) => (
                      <div key={idx} className="p-4 space-y-2">
                        <p className="text-xs text-muted-foreground font-semibold">
                          Prescribed by Dr.{" "}
                          {consultation.doctorName || consultation.doctorID}
                        </p>
                        {consultation.prescriptions &&
                        consultation.prescriptions.length > 0 ? (
                          <div className="space-y-2">
                            {consultation.prescriptions.map(
                              (med: any, medIdx: number) => (
                                <div
                                  key={medIdx}
                                  className="flex justify-between items-start p-2 bg-muted/30 rounded"
                                >
                                  <div>
                                    <p className="font-medium">{med.name}</p>
                                    {med.dosage && (
                                      <p className="text-xs text-muted-foreground">
                                        Dosage: {med.dosage}
                                      </p>
                                    )}
                                    {med.instruction && (
                                      <p className="text-xs text-muted-foreground">
                                        Instructions: {med.instruction}
                                      </p>
                                    )}
                                  </div>
                                  {med.quantity && (
                                    <span className="text-sm font-semibold">
                                      Qty: {med.quantity}
                                    </span>
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No prescriptions
                          </p>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedPatient(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  handleDispenseMedicine(selectedPatient.visit?.id)
                }
              >
                Mark as Dispensed
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
