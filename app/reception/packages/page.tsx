"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Trash2,
  Plus,
  Package as PackageIcon,
  Info,
  Users,
  User,
  ArrowLeft,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PackagesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <PackagesContent />
    </Suspense>
  );
}

function PackagesContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [packages, setPackages] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    totalPrice: "",
  });
  const [packageItems, setPackageItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("manage");
  const [patientPackages, setPatientPackages] = useState<any[]>([]);
  const [selectedPackageForPatients, setSelectedPackageForPatients] = useState<
    any | null
  >(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "patients") {
      setActiveTab("patients");
    }
  }, [searchParams]);

  // Item selection state
  const [itemType, setItemType] = useState<string>("treatment");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [availableItems, setAvailableItems] = useState<{
    [key: string]: any[];
  }>({
    treatment: [],
    medicine: [],
    service: [],
    bed: [],
  });
  const [itemPrice, setItemPrice] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<string>("1");

  const apiUrl = "/api/packages";

  const fetchPackages = async () => {
    try {
      const res = await axios.get(apiUrl);
      setPackages(res.data);
    } catch (error) {
      console.error("Failed to fetch packages");
    }
  };

  const fetchPatientPackages = async () => {
    try {
      const res = await axios.get("/api/patient-packages");
      setPatientPackages(res.data);
    } catch (error) {
      console.error("Failed to fetch patient packages");
    }
  };

  const fetchAllAvailableItems = async () => {
    try {
      const [treatments, medicines, services, beds] = await Promise.all([
        axios.get("/api/treatments"),
        axios.get("/api/inventory"),
        axios.get("/api/services"),
        axios.get("/api/resources"),
      ]);

      setAvailableItems({
        treatment: treatments.data,
        medicine: medicines.data,
        service: services.data,
        bed: beds.data,
      });
    } catch (error) {
      console.error("Failed to fetch available items");
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchAllAvailableItems();
    fetchPatientPackages();
  }, []);

  const handleAddItem = () => {
    const item = availableItems[itemType].find(
      (i: any) => i.id === selectedItemId || i.resourceID === selectedItemId,
    );
    if (!item) return;

    const newItem = {
      type: itemType,
      id: item.id || item.resourceID,
      name: item.name,
      price: Number(itemPrice),
      quantity: Number(itemQuantity),
    };

    setPackageItems([...packageItems, newItem]);

    // Reset selection
    setSelectedItemId("");
    setItemPrice("");
    setItemQuantity("1");

    // Auto-recalculate total price
    const newTotal = [...packageItems, newItem].reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );
    setFormData((prev) => ({ ...prev, totalPrice: newTotal.toString() }));
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = packageItems.filter((_, i) => i !== index);
    setPackageItems(updatedItems);
    const newTotal = updatedItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );
    setFormData((prev) => ({ ...prev, totalPrice: newTotal.toString() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (packageItems.length === 0) {
      alert("Please add at least one item to the package");
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        totalPrice: Number(formData.totalPrice),
        items: packageItems,
      };

      if (editingId) {
        await axios.put(apiUrl, { id: editingId, ...data });
      } else {
        await axios.post(apiUrl, data);
      }

      handleCancel();
      fetchPackages();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to save package");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pkg: any) => {
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      totalPrice: pkg.totalPrice.toString(),
    });
    setPackageItems(pkg.items);
    setEditingId(pkg.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await axios.delete(`${apiUrl}?id=${id}`);
      fetchPackages();
    } catch (error) {
      alert("Failed to delete package");
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", description: "", totalPrice: "" });
    setPackageItems([]);
    setEditingId(null);
    setSelectedItemId("");
    setItemPrice("");
    setItemQuantity("1");
  };

  const onTypeChange = (val: string) => {
    setItemType(val);
    setSelectedItemId("");
    setItemPrice("");
  };

  const onItemSelect = (val: string) => {
    setSelectedItemId(val);
    const item = availableItems[itemType].find(
      (i: any) => i.id === val || i.resourceID === val,
    );
    if (item) {
      setItemPrice((item.price || item.unitPrice || "0").toString());
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "receptionist")) {
    return <div className="p-10">Access Denied</div>;
  }

  return (
    <AppLayout>
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <PackageIcon className="h-6 w-6 text-sky-600" />
          <h1 className="text-xl font-bold text-slate-800">Manage Packages</h1>
        </div>
        <Button
          variant="ghost"
          className="text-sm font-semibold text-slate-500 hover:text-sky-600"
          onClick={() => router.back()}
        >
          Back
        </Button>
      </nav>

      <main className="p-6">
        <div className="space-y-6">
          <div className="flex p-1 bg-slate-100 rounded-lg max-w-[400px]">
            <button
              onClick={() => setActiveTab("manage")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "manage" ? "bg-white shadow-sm text-sky-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              Manage Packages
            </button>
            <button
              onClick={() => setActiveTab("patients")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "patients" ? "bg-white shadow-sm text-sky-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              Package Patients
            </button>
          </div>

          {activeTab === "manage" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
              {/* Form Section */}
              <div className="lg:col-span-5 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {editingId ? "Edit Package" : "Create New Package"}
                    </CardTitle>
                    <CardDescription>
                      Define a bundle of services and items
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-1">
                        <Label>Package Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e: any) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                          placeholder="e.g. Executive Health Checkup"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Description</Label>
                        <Input
                          value={formData.description}
                          onChange={(e: any) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          placeholder="Brief details about the package"
                        />
                      </div>

                      <div className="pt-4 border-t">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-700">
                          <Plus className="h-4 w-4" /> Add Items to Package
                        </h3>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Category</Label>
                            <Select
                              value={itemType}
                              onValueChange={onTypeChange}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="treatment">
                                  Treatment
                                </SelectItem>
                                <SelectItem value="medicine">
                                  Medicine
                                </SelectItem>
                                <SelectItem value="service">Service</SelectItem>
                                <SelectItem value="bed">Bed/Room</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Select Item</Label>
                            <Select
                              value={selectedItemId}
                              onValueChange={onItemSelect}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chose item" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableItems[itemType].map((item: any) => (
                                  <SelectItem
                                    key={item.id || item.resourceID}
                                    value={item.id || item.resourceID}
                                  >
                                    {item.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Price (Override)</Label>
                            <Input
                              type="number"
                              value={itemPrice}
                              onChange={(e: any) =>
                                setItemPrice(e.target.value)
                              }
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Quantity</Label>
                            <Input
                              type="number"
                              value={itemQuantity}
                              onChange={(e: any) =>
                                setItemQuantity(e.target.value)
                              }
                              placeholder="1"
                              min="1"
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full mt-3 text-sky-600 border-sky-200 hover:bg-sky-50"
                          onClick={handleAddItem}
                          disabled={!selectedItemId}
                        >
                          Add Item
                        </Button>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center mb-4">
                          <Label className="text-base font-bold text-slate-800">
                            Total Package Price (Rs.)
                          </Label>
                          <Input
                            type="number"
                            value={formData.totalPrice}
                            onChange={(e: any) =>
                              setFormData({
                                ...formData,
                                totalPrice: e.target.value,
                              })
                            }
                            className="w-32 font-bold text-sky-600 text-right"
                            required
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            className="flex-1"
                            disabled={loading}
                          >
                            {loading
                              ? "Saving..."
                              : editingId
                                ? "Update Package"
                                : "Create Package"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* List Section */}
              <div className="lg:col-span-7 space-y-6">
                {/* Current Package Preview */}
                {packageItems.length > 0 && (
                  <Card className="border-sky-100 bg-sky-50/20">
                    <CardHeader className="py-4">
                      <CardTitle className="text-sm">
                        Items in this Package
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 pb-4">
                      <div className="space-y-2">
                        {packageItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 shadow-sm"
                          >
                            <div>
                              <div className="text-xs font-bold text-sky-600 uppercase tracking-tight">
                                {item.type}
                              </div>
                              <div className="text-sm font-semibold">
                                {item.name}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Qty: {item.quantity} × Rs. {item.price}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-sm font-bold text-slate-800">
                                Rs. {item.price * item.quantity}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:bg-red-50 p-1 h-auto"
                                onClick={() => handleRemoveItem(idx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Package Catalog */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-800">
                    Package Catalog
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packages.length > 0 ? (
                      packages.map((pkg) => (
                        <Card
                          key={pkg.id}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base">
                                {pkg.name}
                              </CardTitle>
                              <span className="text-sky-600 font-bold">
                                Rs. {pkg.totalPrice}
                              </span>
                            </div>
                            {pkg.description && (
                              <CardDescription className="line-clamp-1">
                                {pkg.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="pb-4">
                            <div className="text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded">
                              {pkg.items.length} items bundled
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleEdit(pkg)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-red-500 border-red-100 hover:bg-red-50"
                                onClick={() => handleDelete(pkg.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full bg-white p-12 text-center rounded-xl border border-dashed text-slate-400">
                        <PackageIcon className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>No packages defined yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "patients" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {!selectedPackageForPatients ? (
                <>
                  {/* Patients in Multiple Packages */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-amber-500" />
                        Patients in Multiple Packages
                      </CardTitle>
                      <CardDescription>
                        Patients currently enrolled in more than one active
                        package
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(
                          patientPackages.reduce((acc: any, curr: any) => {
                            if (curr.status === "active") {
                              acc[curr.patientID] = acc[curr.patientID] || {
                                name: curr.patientName,
                                packages: [],
                              };
                              acc[curr.patientID].packages.push(
                                curr.packageName,
                              );
                            }
                            return acc;
                          }, {}),
                        )
                          .filter(([_, data]: any) => data.packages.length > 1)
                          .map(([patientID, data]: any) => (
                            <div
                              key={patientID}
                              className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100"
                            >
                              <div>
                                <div className="font-bold text-slate-800">
                                  {data.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                  ID: {patientID}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 justify-end max-w-[50%]">
                                {data.packages.map(
                                  (pkgName: string, i: number) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 bg-white border border-amber-200 text-[10px] font-bold text-amber-600 rounded"
                                    >
                                      {pkgName}
                                    </span>
                                  ),
                                )}
                              </div>
                            </div>
                          ))}
                        {Object.entries(
                          patientPackages.reduce((acc: any, curr: any) => {
                            if (curr.status === "active") {
                              acc[curr.patientID] = acc[curr.patientID] || {
                                name: curr.patientName,
                                packages: [],
                              };
                              acc[curr.patientID].packages.push(
                                curr.packageName,
                              );
                            }
                            return acc;
                          }, {}),
                        ).filter(([_, data]: any) => data.packages.length > 1)
                          .length === 0 && (
                          <div className="text-center py-6 text-slate-400 italic">
                            No patients found in multiple packages
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Package Statistics / List */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {packages.map((pkg) => {
                      const enrolledCount = patientPackages.filter(
                        (pp) =>
                          pp.packageID === pkg.id && pp.status === "active",
                      ).length;

                      return (
                        <Card
                          key={pkg.id}
                          className="cursor-pointer hover:shadow-md transition-shadow group"
                          onClick={() => setSelectedPackageForPatients(pkg)}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex justify-between items-center text-slate-600">
                              {pkg.name}
                              <ArrowLeft className="h-4 w-4 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-black text-sky-600">
                              {enrolledCount}
                            </div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                              Active Patients
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedPackageForPatients(null)}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Overview
                  </Button>

                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-xl">
                            {selectedPackageForPatients.name}
                          </CardTitle>
                          <CardDescription>
                            List of patients enrolled in this package
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-sky-600">
                            {
                              patientPackages.filter(
                                (pp) =>
                                  pp.packageID ===
                                    selectedPackageForPatients.id &&
                                  pp.status === "active",
                              ).length
                            }
                          </div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">
                            Total Active
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Patient Name</TableHead>
                            <TableHead>Patient ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {patientPackages
                            .filter(
                              (pp) =>
                                pp.packageID ===
                                  selectedPackageForPatients.id &&
                                pp.status === "active",
                            )
                            .map((pp) => (
                              <TableRow key={pp.id}>
                                <TableCell className="font-medium">
                                  {pp.patientName}
                                </TableCell>
                                <TableCell>{pp.patientID}</TableCell>
                                <TableCell>
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">
                                    {pp.status}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-sky-600"
                                    onClick={() =>
                                      router.push(
                                        `/reception/patient/${pp.patientID}`,
                                      )
                                    }
                                  >
                                    View Profile
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          {patientPackages.filter(
                            (pp) =>
                              pp.packageID === selectedPackageForPatients.id &&
                              pp.status === "active",
                          ).length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="text-center py-10 text-slate-400 italic"
                              >
                                No patients currently enrolled in this package
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
