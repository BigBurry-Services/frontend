"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
    if (!bed.isOccupied) {
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Create Bed Section */}
      <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
        <h2 className="text-lg font-semibold mb-4 text-slate-800">
          Add New Bed
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Bed Name / Number"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g. Bed 101"
          />
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Type</label>
            <select
              className="w-full h-10 rounded-md border border-slate-300 px-3 bg-white text-sm"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
            >
              <option value="General">General Ward</option>
              <option value="ICU">ICU</option>
              <option value="Private">Private Room</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Adding..." : "Add Bed"}
          </Button>
        </form>
      </div>

      {/* Bed List Section */}
      <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Current Beds</h2>
          <Button variant="ghost" onClick={fetchBeds}>
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {beds.map((bed) => (
            <div
              key={bed.resourceID}
              onClick={() => handleBedClick(bed)}
              className={`cursor-pointer p-4 rounded-lg border flex flex-col items-center justify-center transition-all hover:shadow-md relative group ${
                bed.isOccupied
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              <button
                onClick={(e) => handleDelete(bed.resourceID, e)}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 rounded-full"
                title="Delete Bed"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>

              <span className="font-bold text-lg">{bed.name}</span>
              <span className="text-xs uppercase font-semibold mt-1">
                {bed.type}
              </span>
              <span className="text-xs mt-1 opacity-75">
                {bed.isOccupied ? "Occupied" : "Available"}
              </span>
            </div>
          ))}
          {beds.length === 0 && (
            <p className="text-slate-400 col-span-full text-center py-8">
              No beds configured
            </p>
          )}
        </div>
      </div>

      {selectedBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h3 className="font-bold text-slate-800">
                {selectedBed.name} (
                {selectedBed.isOccupied ? "Occupied" : "Available"})
              </h3>
              <button
                onClick={() => setSelectedBed(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedBed.isOccupied ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Current Patient:{" "}
                    <strong>{selectedBed.currentPatientID}</strong>
                  </p>
                  <p className="text-sm text-slate-600">
                    Admission Date:{" "}
                    {selectedBed.admissionDate
                      ? new Date(selectedBed.admissionDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDischarge}
                  >
                    Discharge Patient
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">
                      Select Patient
                    </label>
                    <select
                      className="w-full border rounded-md p-2 text-sm"
                      value={assignData.patientID}
                      onChange={(e) =>
                        setAssignData({
                          ...assignData,
                          patientID: e.target.value,
                        })
                      }
                    >
                      <option value="">-- Choose Patient --</option>
                      {patients.map((p: any) => (
                        <option key={p.patientID} value={p.patientID}>
                          {p.name} ({p.patientID})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">
                      Admission Date
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-md p-2 text-sm"
                      value={assignData.admissionDate}
                      onChange={(e) =>
                        setAssignData({
                          ...assignData,
                          admissionDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">
                      Expected Discharge
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-md p-2 text-sm"
                      value={assignData.expectedDischargeDate}
                      onChange={(e) =>
                        setAssignData({
                          ...assignData,
                          expectedDischargeDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button className="w-full" onClick={handleAssign}>
                    Assign Bed
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
