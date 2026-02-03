"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { useEffect, useState, use } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";

export default function PatientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [visits, setVisits] = useState([]);

  // Unwrap params using use() hook as per Next.js 15/latest guidance or simply await if it's async component
  // In client component, params are promises in latest next types, but usually we handle them with use() or await in async parent.
  // For simplicity in this specific client setup, we'll try to use `use` or treat it as sync if passed directly (depends on version).
  // Safest: Use `use(params)` if React 19/Next 15, or just wait for it.
  const [id, setId] = useState<string>("");

  const [doctors, setDoctors] = useState([]);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [visitReason, setVisitReason] = useState("");
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    params.then((unwrapped) => setId(unwrapped.id));
  }, [params]);

  const apiUrl = "/api";

  useEffect(() => {
    // Fetch Doctors
    axios
      .get(`${apiUrl}/users?role=doctor`)
      .then((res) => setDoctors(res.data))
      .catch(console.error);
  }, []);

  const submitVisit = async () => {
    if (selectedDoctors.length === 0)
      return alert("Please select at least one doctor");
    try {
      await axios.post(`${apiUrl}/visits`, {
        patientID: id, // Use the ID from params
        doctorIDs: selectedDoctors,
        visitDate: new Date(visitDate),
        reason: visitReason,
        // Status defaults to waiting in backend
      });
      setShowVisitModal(false);
      // Refresh logic
      const visitsRes = await axios.get(`${apiUrl}/visits?patientID=${id}`);
      setVisits(visitsRes.data);
    } catch (error) {
      alert("Failed to create visit");
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [patientRes, visitsRes] = await Promise.all([
          axios.get(`${apiUrl}/patients/${id}`),
          axios.get(`${apiUrl}/visits?patientID=${id}`),
        ]);
        setPatient(patientRes.data);
        setVisits(visitsRes.data);
      } catch (error) {
        console.error("Failed to fetch data");
      }
    };
    fetchData();
  }, [id, apiUrl]);

  if (!user || (user.role !== "admin" && user.role !== "receptionist")) {
    return <div className="p-10">Access Denied</div>;
  }

  if (!patient) return <div className="p-10">Loading...</div>;

  return (
    <AppLayout>
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center no-print">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            ← Back
          </Button>
          <h1 className="text-xl font-bold text-sky-600">Patient Details</h1>
        </div>
        <div>
          <Button onClick={() => setShowVisitModal(true)}>
            + Create New Visit
          </Button>
        </div>
      </nav>

      <main className="p-6 space-y-6">
        {/* Patient Info Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {patient.name}
              </h2>
              <p className="text-slate-500 font-mono text-sm mt-1">
                {patient.patientID}
              </p>
            </div>
            <div className="text-right text-sm text-slate-600 space-y-1">
              <p>
                {patient.age} years / {patient.gender}
              </p>
              <p>{patient.mobile}</p>
              <p>{patient.address}</p>
            </div>
          </div>
        </div>

        {/* Visits History */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Visit History & Assigned Doctors
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3">Visited Date</th>
                  <th className="px-4 py-3">Token Number</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Assigned Doctors</th>
                  <th className="px-4 py-3">Status of Patient</th>
                  <th className="px-4 py-3">View Button</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v: any) => (
                  <tr
                    key={v.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(v.visitDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium">#{v.tokenNumber}</td>
                    <td className="px-4 py-3 text-slate-700 italic">
                      {v.reason || "-"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-sky-700">
                      {v.consultations && v.consultations.length > 0
                        ? v.consultations
                            .map(
                              (c: any) => `Dr. ${c.doctorName || c.doctorID}`,
                            )
                            .join(", ")
                        : `Dr. ${v.doctorIDs?.join(", ") || v.doctorID || "Unknown"}`}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs capitalize
                                ${
                                  v.status.toLowerCase() === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : v.status.toLowerCase().includes("waiting")
                                      ? "bg-yellow-100 text-yellow-700"
                                      : v.status
                                            .toLowerCase()
                                            .includes("consulting")
                                        ? "bg-green-50 text-green-600"
                                        : v.status === "cancelled"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-slate-100 text-slate-700"
                                }
                            `}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        className="h-8 text-xs ml-2"
                        onClick={() => router.push(`/reception/visit/${v.id}`)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
                {visits.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-slate-400">
                      No previous visits
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Visit Modal */}
      {showVisitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Create Visit</h3>
            <div className="text-sm text-slate-600">
              Patient: <span className="font-semibold">{patient?.name}</span> (
              {patient?.patientID})
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Select Doctors (Multiple allowed)
              </label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                {doctors.map((d: any) => (
                  <label
                    key={d.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      value={d.username}
                      checked={selectedDoctors.includes(d.username)}
                      onChange={(e) => {
                        if (e.target.checked)
                          setSelectedDoctors([...selectedDoctors, d.username]);
                        else
                          setSelectedDoctors(
                            selectedDoctors.filter((id) => id !== d.username),
                          );
                      }}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>
                      Dr. {d.name}{" "}
                      <span className="text-slate-500 text-xs">
                        ({d.specialization})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Visit Date
              </label>
              <input
                type="date"
                className="w-full p-2 text-sm border rounded-md focus:outline-none focus:border-sky-500"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Reason for Visit / Symptoms
              </label>
              <textarea
                className="w-full p-2 text-sm border rounded-md focus:outline-none focus:border-sky-500"
                placeholder="E.g. Fever, Headache..."
                rows={3}
                value={visitReason}
                onChange={(e) => setVisitReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => setShowVisitModal(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={submitVisit}>
                Create Token
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
