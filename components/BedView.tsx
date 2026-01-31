"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";

import { Button } from "@/components/ui/Button";

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
  const [assignData, setAssignData] = useState({
    patientID: "",
    admissionDate: new Date().toISOString().split("T")[0],
    expectedDischargeDate: "",
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchPatients = async () => {
    try {
      const res = await axios.get(`${apiUrl}/patients`);
      setPatients(res.data);
    } catch (error) {
      console.error("Failed to fetch patients");
    }
  };

  const handleBedClick = (bed: Resource) => {
    setSelectedBed(bed);
    if (!bed.isOccupied) {
      fetchPatients();
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
      alert("Bed Assigned Successfully");
      setSelectedBed(null);
      // Socket update will handle the UI refresh ideally, otherwise manual refresh if needed
      window.location.reload();
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
        alert("Patient Discharged from Bed");
        setSelectedBed(null);
        window.location.reload();
      } catch (error) {
        alert("Failed to discharge");
      }
    }
  };

  useEffect(() => {
    // Initial fetch
    const fetchBeds = async () => {
      try {
        const res = await axios.get(`${apiUrl}/resources`);
        setBeds(res.data);
      } catch (error) {
        console.error("Failed to fetch beds");
      }
    };
    fetchBeds();

    // Socket connection
    const socket = io(apiUrl);

    socket.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    socket.on("bed_status_update", (updatedBed: Resource) => {
      setBeds((prevBeds) =>
        prevBeds.map((bed) =>
          bed.resourceID === updatedBed.resourceID ? updatedBed : bed,
        ),
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [apiUrl]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h2 className="text-lg font-semibold mb-4 text-slate-800">
        Live Bed Status
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {beds.map((bed) => (
          <div
            key={bed.resourceID}
            onClick={() => handleBedClick(bed)}
            className={`cursor-pointer p-4 rounded-lg border flex flex-col items-center justify-center transition-all hover:shadow-md ${
              bed.isOccupied
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-green-50 border-green-200 text-green-700"
            }`}
          >
            <span className="font-bold text-lg">{bed.name}</span>
            <span className="text-xs uppercase font-semibold mt-1">
              {bed.isOccupied ? "Occupied" : "Available"}
            </span>
            {bed.isOccupied && bed.currentPatientID && (
              <span className="text-xs mt-1 opacity-75">
                Pt: {bed.currentPatientID}
              </span>
            )}
          </div>
        ))}
        {beds.length === 0 && (
          <p className="text-slate-400 col-span-full text-center">
            No beds configured
          </p>
        )}
      </div>

      {selectedBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
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
                      className="w-full border rounded p-2 text-sm"
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
                      className="w-full border rounded p-2 text-sm"
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
                      className="w-full border rounded p-2 text-sm"
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
