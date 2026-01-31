"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import axios from "axios";

// Types
interface Visit {
  _id: string;
  tokenNumber: number;
  patientID: string;
  status: string;
  visitDate: string;
  notes?: string;
  reason?: string;
  prescriptions?: { name: string; dosage: string; instruction: string }[];
}

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);

  const [notes, setNotes] = useState("");
  const [medicines, setMedicines] = useState([]); // Inventory list
  const [selectedMedicines, setSelectedMedicines] = useState<
    { name: string; dosage: string; instruction: string }[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");

  const apiUrl = "/api";

  const fetchVisits = async () => {
    try {
      // Fetch only waiting/in_consultation
      const res = await axios.get(`${apiUrl}/visits`);
      setVisits(
        res.data.filter((v: Visit) => {
          // Check if status string contains my username (e.g. "Waiting for Dr. admin", "Consulting with Dr. admin")
          // Also allowing generic "waiting" just in case of old data during transition, though not strictly needed
          return (
            (v.status.includes(user?.username || "") &&
              !v.status.includes("Completed")) ||
            v.status === "waiting" ||
            v.status === "in_consultation"
          );
        }),
      );
    } catch (error) {
      console.error("Failed to fetch visits");
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await axios.get(`${apiUrl}/inventory`);
      setMedicines(res.data);
    } catch (e) {
      console.error("Failed to fetch inventory");
    }
  };

  useEffect(() => {
    fetchVisits();
    fetchMedicines();
  }, []);

  // Start: Multi-doctor logic
  const myConsultation = (visit: any) => {
    if (!user?.username) return null;
    return visit.consultations?.find((c: any) => c.doctorID === user.username);
  };

  useEffect(() => {
    if (selectedVisit && user?.username) {
      const myCons = myConsultation(selectedVisit);
      // If found in consultations, load that data. Else fall back to global (legacy or fallback)
      if (myCons) {
        setNotes(myCons.notes || "");
        setSelectedMedicines(myCons.prescriptions || []);
      } else {
        setNotes(selectedVisit.notes || "");
        setSelectedMedicines(selectedVisit.prescriptions || []);
      }

      axios
        .get(`${apiUrl}/patients/${selectedVisit.patientID}`)
        .then((res) => setPatientDetails(res.data))
        .catch(() => setPatientDetails(null));
    } else {
      setPatientDetails(null);
      setNotes("");
      setSelectedMedicines([]);
    }
  }, [selectedVisit, user]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await axios.patch(`${apiUrl}/visits/${id}/status`, {
        status: newStatus,
        notes: newStatus === "completed" ? notes : undefined,
        prescriptions:
          newStatus === "completed" ? selectedMedicines : undefined,
        doctorID: user?.username, // Send my ID to update ONLY my part
      });

      // Local State Update for Immediate Transition
      let optimisiticStatus = newStatus;
      if (newStatus === "in_consultation") {
        optimisiticStatus = `Consulting with Dr. ${user?.username || ""}`;
      } else if (newStatus === "completed") {
        // We don't know the next status easily without backend knowing the queue
        // So for "completed", we might just remove it from the list or set it to "Processing..."
        // Or assume it leaves our queue:
        setSelectedVisit(null);
        setVisits(visits.filter((v) => v._id !== id));
        fetchVisits(); // Fetch to be sure
        return;
      }

      if (selectedVisit && selectedVisit._id === id) {
        setSelectedVisit({ ...selectedVisit, status: optimisiticStatus });
      }
      setVisits(
        visits.map((v) =>
          v._id === id ? { ...v, status: optimisiticStatus } : v,
        ),
      );

      // Still fetch to be safe/sync
      fetchVisits();
    } catch (e) {
      alert("Update failed");
    }
  };
  // End: Multi-doctor logic

  if (!user || (user.role !== "admin" && user.role !== "doctor")) {
    return <div className="p-10">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-sky-600">Doctor Dashboard</h1>
        <div className="flex gap-4 items-center">
          <span className="text-slate-600">Dr. {user.username}</span>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Queue List */}
        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[calc(100vh-100px)] overflow-auto">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">
            OP Queue
          </h2>
          <div className="space-y-3">
            {visits.map((visit) => (
              <div
                key={visit._id}
                onClick={() => setSelectedVisit(visit)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedVisit?._id === visit._id ? "border-sky-500 bg-sky-50" : "border-slate-200 hover:border-sky-300"}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lg text-slate-700">
                    Token #{visit.tokenNumber}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${visit.status === "waiting" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                  >
                    {visit.status}
                  </span>
                </div>
                <div className="text-sm text-slate-500">
                  Patient ID: {visit.patientID}
                </div>
              </div>
            ))}
            {visits.length === 0 && (
              <p className="text-slate-400 text-center">No patients in queue</p>
            )}
          </div>
        </div>

        {/* Consultation Area */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[calc(100vh-100px)] overflow-y-auto">
          {selectedVisit ? (
            <div className="h-full flex flex-col">
              <div className="h-full flex flex-col">
                {(() => {
                  const myCons = myConsultation(selectedVisit);
                  // We prioritize the global status string now
                  const currentStatus = selectedVisit.status;

                  // 1. Waiting State: Centered Start Button
                  // Check if status is strictly waiting for ME
                  if (
                    currentStatus === `Waiting for Dr. ${user.username}` ||
                    currentStatus === "waiting"
                  ) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center space-y-8">
                        <div className="w-full max-w-md bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                          <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            Token #{selectedVisit.tokenNumber}
                          </h2>
                          <div className="text-slate-600 mb-6 space-y-2">
                            {patientDetails ? (
                              <>
                                <p className="text-lg font-semibold text-sky-700">
                                  {patientDetails.name}
                                </p>
                                <p>
                                  {patientDetails.age} Years /{" "}
                                  {patientDetails.gender}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {patientDetails.mobile}
                                </p>
                              </>
                            ) : (
                              <p className="animate-pulse">
                                Loading Details...
                              </p>
                            )}
                          </div>

                          {selectedVisit.reason && (
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-left mb-6">
                              <p className="text-xs font-bold text-yellow-700 uppercase mb-1">
                                Reason for Visit
                              </p>
                              <p className="text-slate-800">
                                {selectedVisit.reason}
                              </p>
                            </div>
                          )}

                          <Button
                            className="w-full py-6 text-xl"
                            onClick={() =>
                              handleStatusChange(
                                selectedVisit._id,
                                "in_consultation",
                              )
                            }
                          >
                            Start Consultation
                          </Button>
                        </div>
                        <p className="text-slate-400 text-sm">
                          Click start to prescribe medicines and add notes.
                        </p>
                      </div>
                    );
                  }

                  // 2. In-Consultation State: Full View
                  return (
                    <>
                      <div className="border-b pb-4 mb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-xl font-bold text-slate-800">
                              Consultation - Token #{selectedVisit.tokenNumber}
                            </h2>
                            <div className="mt-2 text-slate-600">
                              {patientDetails ? (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm space-y-1">
                                  <p>
                                    <span className="font-semibold">Name:</span>{" "}
                                    {patientDetails.name}
                                  </p>
                                  <p>
                                    <span className="font-semibold">
                                      Age/Gender:
                                    </span>{" "}
                                    {patientDetails.age} /{" "}
                                    {patientDetails.gender}
                                  </p>
                                  <p>
                                    <span className="font-semibold">
                                      Mobile:
                                    </span>{" "}
                                    {patientDetails.mobile}
                                  </p>
                                </div>
                              ) : (
                                <p className="animate-pulse">Loading...</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                              In Progress
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 space-y-6 overflow-y-auto">
                        {/* Medicines Selection */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Prescribe Medicines
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Search & Add */}
                            <div className="border rounded-lg p-3 bg-slate-50 flex flex-col h-64">
                              <input
                                type="text"
                                placeholder="Search medicines..."
                                className="w-full mb-2 p-2 text-sm border rounded focus:outline-none focus:border-sky-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                              <div className="flex-1 overflow-y-auto space-y-1">
                                {medicines
                                  .filter((m: any) =>
                                    m.name
                                      .toLowerCase()
                                      .includes(searchTerm.toLowerCase()),
                                  )
                                  .map((m: any) => {
                                    const isAdded = selectedMedicines.some(
                                      (sel) => sel.name === m.name,
                                    );
                                    return (
                                      <div
                                        key={m._id}
                                        className="flex justify-between items-center p-2 bg-white rounded border border-slate-200"
                                      >
                                        <div>
                                          <p className="text-sm font-medium text-slate-800">
                                            {m.name}
                                          </p>
                                          <p className="text-xs text-slate-500">
                                            Stock: {m.stock}
                                          </p>
                                        </div>
                                        <Button
                                          className="h-6 text-xs px-2"
                                          disabled={isAdded}
                                          onClick={() => {
                                            if (!isAdded) {
                                              setSelectedMedicines([
                                                ...selectedMedicines,
                                                {
                                                  name: m.name,
                                                  dosage: "",
                                                  instruction: "",
                                                },
                                              ]);
                                            }
                                          }}
                                        >
                                          {isAdded ? "Added" : "Add"}
                                        </Button>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>

                            {/* Selected List */}
                            <div className="border rounded-lg p-3 bg-white h-64 overflow-y-auto">
                              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                                Selected Medicines
                              </h3>
                              {selectedMedicines.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">
                                  No medicines selected
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {selectedMedicines.map((med, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 bg-sky-50 rounded border border-sky-100 space-y-2"
                                    >
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-sky-800">
                                          {med.name}
                                        </span>
                                        <button
                                          className="text-red-500 hover:text-red-700 text-xs font-bold px-2"
                                          onClick={() =>
                                            setSelectedMedicines(
                                              selectedMedicines.filter(
                                                (_, i) => i !== idx,
                                              ),
                                            )
                                          }
                                        >
                                          ✕
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <input
                                          type="text"
                                          placeholder="Dosage"
                                          className="w-full p-1 text-xs border rounded"
                                          value={med.dosage}
                                          onChange={(e) => {
                                            const newMeds = [
                                              ...selectedMedicines,
                                            ];
                                            newMeds[idx].dosage =
                                              e.target.value;
                                            setSelectedMedicines(newMeds);
                                          }}
                                        />
                                        <input
                                          type="text"
                                          placeholder="Instr."
                                          className="w-full p-1 text-xs border rounded"
                                          value={med.instruction}
                                          onChange={(e) => {
                                            const newMeds = [
                                              ...selectedMedicines,
                                            ];
                                            newMeds[idx].instruction =
                                              e.target.value;
                                            setSelectedMedicines(newMeds);
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Clinical Notes
                          </label>
                          <textarea
                            className="w-full h-32 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                            placeholder="Enter diagnosis, symptoms, and additional instructions..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          ></textarea>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                          <Button
                            onClick={() =>
                              handleStatusChange(selectedVisit._id, "completed")
                            }
                            className="bg-green-600 hover:bg-green-700 w-full md:w-auto py-3 text-lg"
                          >
                            Complete & Prescribe
                          </Button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              Select a patient from the queue to start consultation
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
