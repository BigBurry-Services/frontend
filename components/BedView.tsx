"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  Bed,
  BedDouble,
  Activity,
  AlertCircle,
  Plus,
  LayoutGrid,
} from "lucide-react";

interface Resource {
  resourceID: string;
  name: string;
  type: string;
  isOccupied: boolean;
  currentPatientID?: string;
  admissionDate?: string;
  expectedDischargeDate?: string;
}

export default function BedView() {
  const [beds, setBeds] = useState<Resource[]>([]);
  const [selectedBed, setSelectedBed] = useState<Resource | null>(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDischargeDate, setEditDischargeDate] = useState("");

  // Creation Form State
  const [formData, setFormData] = useState({
    name: "",
    type: "General",
  });

  // Assignment State
  const [assignData, setAssignData] = useState({
    patientID: "",
    admissionDate: new Date().toISOString().split("T")[0],
    expectedDischargeDate: "",
  });

  const apiUrl = "/api";

  const fetchBeds = async () => {
    try {
      const res = await axios.get(`${apiUrl}/resources`);
      setBeds(res.data);
    } catch (error) {
      console.error("Failed to fetch beds");
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await axios.get(`${apiUrl}/patients`);
      setPatients(res.data);
    } catch (error) {
      console.error("Failed to fetch patients");
    }
  };

  useEffect(() => {
    fetchBeds();
    fetchPatients();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Basic ID generation for resourceID
      const resourceID = formData.name.replace(/\s+/g, "-").toUpperCase();

      await axios.post(`${apiUrl}/resources`, {
        ...formData,
        resourceID,
        isOccupied: false,
      });

      setFormData({ name: "", type: "General" });
      fetchBeds();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create bed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resourceID: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!confirm("Are you sure you want to delete this bed?")) return;
    try {
      await axios.delete(`${apiUrl}/resources/${resourceID}`);
      fetchBeds();
    } catch (error) {
      alert("Failed to delete bed");
    }
  };

  const handleBedClick = (bed: Resource) => {
    setSelectedBed(bed);
    setIsEditing(false);
    if (bed.isOccupied) {
      setEditDischargeDate(bed.expectedDischargeDate || "");
    } else {
      setAssignData((prev) => ({
        ...prev,
        patientID: "",
        expectedDischargeDate: "",
      }));
    }
  };

  const handleAssign = async () => {
    if (!selectedBed) return;
    try {
      await axios.patch(
        `${apiUrl}/resources/${selectedBed.resourceID}/status`,
        {
          isOccupied: true,
          patientID: assignData.patientID,
          admissionDate: assignData.admissionDate,
          expectedDischargeDate: assignData.expectedDischargeDate,
        },
      );
      setSelectedBed(null);
      fetchBeds();
    } catch (error) {
      alert("Failed to assign bed");
    }
  };

  const handleUpdateAssignment = async () => {
    if (!selectedBed) return;
    try {
      await axios.patch(
        `${apiUrl}/resources/${selectedBed.resourceID}/status`,
        {
          isOccupied: true,
          patientID: selectedBed.currentPatientID,
          admissionDate: selectedBed.admissionDate,
          expectedDischargeDate: editDischargeDate,
        },
      );
      setIsEditing(false);
      setSelectedBed(null);
      fetchBeds();
    } catch (error) {
      alert("Failed to update assignment");
    }
  };

  const handleDischarge = async () => {
    if (!selectedBed) return;
    if (confirm("Are you sure you want to discharge this patient?")) {
      try {
        await axios.patch(
          `${apiUrl}/resources/${selectedBed.resourceID}/status`,
          {
            isOccupied: false,
          },
        );
        setSelectedBed(null);
        fetchBeds();
      } catch (error) {
        alert("Failed to discharge");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative items-start">
      {/* Create Bed Section - Sticky */}
      <Card className="md:col-span-1 border-primary/20 md:sticky md:top-6 shadow-md">
        <CardHeader className="bg-primary/5 pb-4">
          <div className="flex items-center gap-2 text-primary mb-1">
            <LayoutGrid className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Management
            </span>
          </div>
          <CardTitle className="text-xl">Add New Bed</CardTitle>
          <CardDescription>
            Register a new bed or room in the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bedName" className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-muted-foreground" />
                Bed Name / Number
              </Label>
              <Input
                id="bedName"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="e.g. Bed 101"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bedType" className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Ward / Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(val) => setFormData({ ...formData, type: val })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General Ward</SelectItem>
                  <SelectItem value="ICU">ICU</SelectItem>
                  <SelectItem value="Private">Private Room</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Maternity">Maternity</SelectItem>
                  <SelectItem value="Pediatric">Pediatric</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full font-semibold shadow-sm mt-2"
              disabled={loading}
              size="lg"
            >
              {loading ? (
                "Adding..."
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Add Bed to Inventory
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Bed List Section */}
      <Card className="md:col-span-2 border-border/50 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4 border-b">
          <div>
            <CardTitle>Current Bed Inventory</CardTitle>
            <CardDescription>
              Real-time occupancy status of all hospital beds.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
              Total: {beds.length}
            </span>
            <Button variant="outline" size="sm" onClick={fetchBeds}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="bg-muted/10 min-h-[400px] p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {beds.map((bed) => (
              <div
                key={bed.resourceID}
                onClick={() => handleBedClick(bed)}
                className={`cursor-pointer group relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-lg hover:-translate-y-1 ${
                  bed.isOccupied
                    ? "bg-white border-red-200 shadow-red-100"
                    : "bg-white border-slate-200 hover:border-sky-300"
                }`}
              >
                <div className="absolute top-0 right-0 p-2">
                  {bed.isOccupied ? (
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <div
                    className={`p-2.5 rounded-lg w-fit ${
                      bed.isOccupied
                        ? "bg-red-50 text-red-600"
                        : "bg-sky-50 text-sky-600"
                    }`}
                  >
                    {bed.isOccupied ? (
                      <Activity className="h-5 w-5" />
                    ) : (
                      <Bed className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">
                      {bed.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mt-1 tracking-wider">
                      {bed.type}
                    </p>
                  </div>

                  <div className="pt-2 mt-auto border-t border-slate-50 flex justify-between items-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        bed.isOccupied
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {bed.isOccupied ? "Occupied" : "Vacant"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-destructive -mr-1"
                      onClick={(e) => handleDelete(bed.resourceID, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {beds.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                  <BedDouble className="h-10 w-10 opacity-20 text-slate-900" />
                </div>
                <h3 className="font-semibold text-slate-900">No Beds Found</h3>
                <p className="text-sm mt-1">
                  Start by adding a new bed from the form.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedBed}
        onOpenChange={(open) => !open && setSelectedBed(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5 text-sky-600" />
              {selectedBed?.name} Details
            </DialogTitle>
            <DialogDescription>
              Current Status:{" "}
              <span
                className={
                  selectedBed?.isOccupied
                    ? "text-red-600 font-bold"
                    : "text-green-600 font-bold"
                }
              >
                {selectedBed?.isOccupied ? "Occupied" : "Available"}
              </span>
            </DialogDescription>
          </DialogHeader>

          {selectedBed?.isOccupied ? (
            <div className="space-y-4 py-4">
              <div className="rounded-xl border bg-slate-50/50 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <AlertCircle className="h-5 w-5 text-sky-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Patient ID
                    </div>
                    <div className="font-mono font-bold text-lg text-slate-900">
                      {selectedBed.currentPatientID}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <Activity className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Admitted On
                    </div>
                    <div className="font-medium text-slate-900">
                      {selectedBed.admissionDate
                        ? formatDate(selectedBed.admissionDate)
                        : "N/A"}
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2 pt-2 border-t mt-2">
                    <Label className="text-[10px] uppercase">
                      Edit Expected Discharge
                    </Label>
                    <Input
                      type="date"
                      value={editDischargeDate}
                      onChange={(e) => setEditDischargeDate(e.target.value)}
                      className="bg-white h-8"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-8"
                        onClick={handleUpdateAssignment}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-2 border-t mt-2">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Expected Discharge
                      </div>
                      <div className="font-medium text-slate-900">
                        {selectedBed.expectedDischargeDate
                          ? formatDate(selectedBed.expectedDischargeDate)
                          : "Not Set"}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-sky-600 font-bold"
                      onClick={() => setIsEditing(true)}
                    >
                      Change
                    </Button>
                  </div>
                )}
              </div>

              {!isEditing && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleDischarge}
                >
                  Discharge Patient & Free Bed
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Patient to Admit</Label>
                <Select
                  value={assignData.patientID}
                  onValueChange={(val) =>
                    setAssignData({ ...assignData, patientID: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Search or select patient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p: any) => (
                      <SelectItem key={p.patientID} value={p.patientID}>
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground text-xs ml-2">
                          ({p.patientID})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Admission Date</Label>
                  <Input
                    type="date"
                    value={assignData.admissionDate}
                    onChange={(e) =>
                      setAssignData({
                        ...assignData,
                        admissionDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected Discharge</Label>
                  <Input
                    type="date"
                    value={assignData.expectedDischargeDate}
                    onChange={(e) =>
                      setAssignData({
                        ...assignData,
                        expectedDischargeDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <Button className="w-full mt-2" onClick={handleAssign}>
                Assign Bed to Patient
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
