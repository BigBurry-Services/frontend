"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function VisitDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [visit, setVisit] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((unwrapped) => setId(unwrapped.id));
  }, [params]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const visitRes = await axios.get(`${apiUrl}/visits/${id}`);
        setVisit(visitRes.data);

        if (visitRes.data.patientID) {
          const patientRes = await axios.get(
            `${apiUrl}/patients/${visitRes.data.patientID}`,
          );
          setPatient(patientRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch data");
      }
    };
    fetchData();
  }, [id, apiUrl]);

  if (!user || (user.role !== "admin" && user.role !== "receptionist")) {
    return <div className="p-10">Access Denied</div>;
  }

  if (!visit) return <div className="p-10">Loading Visit...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-sky-600">Visit Details</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </nav>

      <main className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Visit Token #{visit.tokenNumber}
            </h2>
            <p className="text-sm text-slate-500">
              {new Date(visit.visitDate).toLocaleDateString()}{" "}
              {new Date(visit.visitDate).toLocaleTimeString()}
            </p>
            <div className="mt-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${
                          visit.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : visit.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }
                    `}
              >
                Overall Status: {visit.status}
              </span>
            </div>
            {visit.reason && (
              <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
                  Reason for Visit
                </p>
                <p className="text-sm font-medium text-indigo-900">
                  {visit.reason}
                </p>
              </div>
            )}
          </div>
          <div className="text-right">
            {patient && (
              <>
                <p className="font-semibold text-slate-900">{patient.name}</p>
                <p className="text-sm text-slate-500">
                  ID: {patient.patientID}
                </p>
                <p className="text-sm text-slate-500">
                  {patient.age} Y / {patient.gender}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Consultations List */}
        <h3 className="text-lg font-semibold text-slate-800">Consultations</h3>

        {visit.consultations && visit.consultations.length > 0 ? (
          <div className="space-y-4">
            {visit.consultations.map((c: any, idx: number) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
              >
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sky-700">
                      Dr. {c.doctorName || c.doctorID}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide
                                    ${c.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}
                                `}
                    >
                      {c.status}
                    </span>
                  </div>
                  {c.completedAt && (
                    <span className="text-xs text-slate-500 font-mono">
                      Completed: {new Date(c.completedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Notes */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
                      Clinical Notes
                    </h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded border border-slate-100 min-h-[80px]">
                      {c.notes || "No notes."}
                    </p>
                  </div>

                  {/* Prescriptions */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
                      Prescription
                    </h4>
                    {c.prescriptions && c.prescriptions.length > 0 ? (
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-xs text-slate-500">
                            <tr>
                              <th className="px-3 py-2 text-left">Medicine</th>
                              <th className="px-3 py-2 text-left">Dosage</th>
                              <th className="px-3 py-2 text-left">
                                Instructions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {c.prescriptions.map((p: any, pIdx: number) => (
                              <tr key={pIdx}>
                                <td className="px-3 py-2 font-medium text-slate-800">
                                  {p.name}
                                </td>
                                <td className="px-3 py-2 text-slate-600">
                                  {p.dosage}
                                </td>
                                <td className="px-3 py-2 text-slate-500 italic">
                                  {p.instruction}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">
                        No medicines prescribed.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-white rounded-xl text-center text-slate-500">
            <div className="mb-4 p-3 bg-amber-50 text-amber-800 text-sm rounded border border-amber-200">
              <strong>Legacy Visit Data:</strong> This visit was created before
              the Multi-Doctor update. Detailed consultation records per doctor
              are not available for this specific visit.
            </div>
            <div className="mt-4 text-left border-t pt-4">
              <p>
                <strong>Assigned Doctors:</strong> {visit.doctorIDs?.join(", ")}
              </p>
              <p>
                <strong>Notes:</strong> {visit.notes}
              </p>
              <p>
                <strong>Prescriptions:</strong>
              </p>
              <ul className="list-disc pl-5">
                {visit.prescriptions?.map((p: any, i: number) => (
                  <li key={i}>
                    {typeof p === "string" ? p : `${p.name} (${p.dosage})`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
