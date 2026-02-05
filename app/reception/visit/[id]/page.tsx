"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

import { AppLayout } from "@/components/AppLayout";
import { cn, formatDate } from "@/lib/utils";

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

  const apiUrl = "/api";

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
    <AppLayout>
      <nav className="border-b border-border px-4 py-2 flex justify-between items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full no-print">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs uppercase border-border"
            onClick={() => router.back()}
          >
            ← Back
          </Button>
          <h1 className="text-xs uppercase tracking-widest text-muted-foreground">
            Visit Details
          </h1>
        </div>
        <div>
          {visit.status !== "cancelled" && visit.status !== "completed" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs uppercase border-border hover:bg-destructive hover:text-destructive-foreground transition-all"
              onClick={async () => {
                if (
                  !confirm(
                    "Are you sure you want to cancel this visit? This action cannot be undone.",
                  )
                )
                  return;
                try {
                  await axios.patch(`${apiUrl}/visits/${id}/status`, {
                    status: "cancelled",
                  });
                  setVisit({ ...visit, status: "cancelled" });
                } catch (error) {
                  alert("Failed to cancel visit");
                }
              }}
            >
              ✕ Cancel Visit
            </Button>
          )}

          {visit.status === "cancelled" &&
            (() => {
              const visitDate = new Date(visit.visitDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return visitDate >= today;
            })() && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs uppercase border-border hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={async () => {
                  if (!confirm("Are you sure you want to reopen this visit?"))
                    return;
                  try {
                    await axios.patch(`${apiUrl}/visits/${id}/status`, {
                      status: "waiting",
                    });
                    setVisit({ ...visit, status: "waiting" });
                    const visitRes = await axios.get(`${apiUrl}/visits/${id}`);
                    setVisit(visitRes.data);
                  } catch (error) {
                    alert("Failed to reopen visit");
                  }
                }}
              >
                ↻ Reopen Visit
              </Button>
            )}
        </div>
      </nav>

      <main className="p-2 md:p-6 space-y-6 w-full">
        {/* Header Info */}
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div>
              <h2 className="text-sm text-foreground uppercase tracking-tighter">
                Visit Token #{visit.tokenNumber}
              </h2>
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatDate(visit.visitDate)}{" "}
                {new Date(visit.visitDate).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-xs uppercase tracking-tighter border bg-secondary text-secondary-foreground border-border",
                )}
              >
                Overall Status: {visit.status}
              </span>
            </div>
            {visit.reason && (
              <div className="p-3 border border-border rounded-lg bg-muted/20">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">
                  Reason for Visit
                </p>
                <p className="text-xs text-foreground italic">
                  "{visit.reason}"
                </p>
              </div>
            )}
          </div>
          <div className="text-right flex flex-col justify-center">
            {patient && (
              <div className="space-y-0.5">
                <p className="text-sm text-foreground uppercase tracking-tight">
                  {patient.name}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-tight">
                  ID: {patient.patientID}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-tight">
                  {patient.age} Y / {patient.gender}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Consultations List */}
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground ml-1">
          Consultations
        </h3>

        {visit.consultations && visit.consultations.length > 0 ? (
          <div className="space-y-4">
            {visit.consultations.map((c: any, idx: number) => (
              <div
                key={idx}
                className="bg-card rounded-xl shadow-none border border-border overflow-hidden"
              >
                <div className="bg-secondary px-4 py-1.5 border-b border-border flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground uppercase tracking-tight">
                      Dr. {c.doctorName || c.doctorID}
                    </span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-xs uppercase tracking-tighter border bg-background text-foreground border-border",
                      )}
                    >
                      {c.status}
                    </span>
                  </div>
                  {c.completedAt && (
                    <span className="text-[10px] text-muted-foreground font-mono tabular-nums uppercase">
                      {new Date(c.completedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Notes */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs text-muted-foreground uppercase tracking-widest px-1">
                      Clinical Notes
                    </h4>
                    <p className="text-xs text-foreground whitespace-pre-wrap bg-muted/20 p-2.5 rounded border border-border min-h-[60px] italic">
                      {c.notes || "No clinical notes recorded."}
                    </p>
                  </div>

                  {/* Prescriptions */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs text-muted-foreground uppercase tracking-widest px-1">
                      Prescription
                    </h4>
                    {c.prescriptions && c.prescriptions.length > 0 ? (
                      <div className="bg-background border border-border rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-secondary text-xs text-muted-foreground uppercase tracking-tighter">
                            <tr>
                              <th className="px-2 py-1.5 text-left">
                                Medicine
                              </th>
                              <th className="px-2 py-1.5 text-left border-l border-border/30">
                                Dosage
                              </th>
                              <th className="px-2 py-1.5 text-left border-l border-border/30">
                                Instructions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {c.prescriptions.map((p: any, pIdx: number) => (
                              <tr
                                key={pIdx}
                                className="hover:bg-muted/30 transition-colors"
                              >
                                <td className="px-2 py-1.5 text-foreground">
                                  {p.name}
                                </td>
                                <td className="px-2 py-1.5 text-muted-foreground border-l border-border/30 tabular-nums">
                                  {p.dosage}
                                </td>
                                <td className="px-2 py-1.5 text-muted-foreground italic border-l border-border/30">
                                  {p.instruction}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-3 border border-dashed border-border rounded-lg flex items-center justify-center bg-muted/5">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-40">
                          No medicines prescribed
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-muted/20 rounded-xl border border-border text-center space-y-4">
            <div className="p-2.5 bg-background border border-border rounded-lg text-left">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground block"></span>
                Legacy Visit Record
              </p>
              <p className="text-xs leading-relaxed italic text-foreground opacity-70">
                This record precedes the Multi-Doctor system. Detailed
                individual consultation logs are unavailable.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest px-1">
                  Assigned Doctors
                </p>
                <div className="p-2 border border-border rounded bg-background text-[11px]">
                  {visit.doctorIDs?.join(", ") || "Unknown/Legacy"}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest px-1">
                  Notes
                </p>
                <div className="p-2 border border-border rounded bg-background text-[11px] italic min-h-[40px]">
                  {visit.notes || "No notes available."}
                </div>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <p className="text-xs text-muted-foreground uppercase tracking-widest px-1">
                Prescriptions
              </p>
              <div className="border border-border rounded-lg overflow-hidden bg-background">
                <ul className="divide-y divide-border">
                  {visit.prescriptions?.map((p: any, i: number) => (
                    <li
                      key={i}
                      className="px-3 py-1.5 text-xs uppercase tracking-tight"
                    >
                      {typeof p === "string" ? p : `${p.name} — ${p.dosage}`}
                    </li>
                  ))}
                  {(!visit.prescriptions ||
                    visit.prescriptions.length === 0) && (
                    <li className="px-3 py-4 text-xs text-center text-muted-foreground uppercase tracking-widest opacity-30">
                      No prescription data
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
