"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function ScheduledVisitsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [scheduledPatients, setScheduledPatients] = useState<any[]>([]);

  const apiUrl = "/api";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, visitsRes] = await Promise.all([
          axios.get(`${apiUrl}/patients`),
          axios.get(`${apiUrl}/visits`),
        ]);

        const allPatients = patientsRes.data;
        const allVisits = visitsRes.data;

        // Filter visits for TODAY
        const now = new Date();
        const startOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        const todaysVisits = allVisits.filter((v: any) => {
          const vDate = new Date(v.visitDate || v.createdAt);
          return vDate >= startOfDay && vDate <= endOfDay;
        });

        // Map visits to patients
        const patientsWithVisits = todaysVisits
          .map((visit: any) => {
            const patient = allPatients.find(
              (p: any) => p.patientID === visit.patientID,
            );
            return {
              ...patient,
              visitStatus: visit.status,
              visitReason: visit.reason,
              visitTime: visit.visitDate,
              visitId: visit.id,
            };
          })
          .filter((p: any) => p && p.patientID); // Ensure patient exists

        setScheduledPatients(patientsWithVisits);
      } catch (error) {
        console.error("Failed to fetch scheduled visits", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!user || (user.role !== "admin" && user.role !== "receptionist")) {
    return <div className="p-10">Access Denied</div>;
  }

  return (
    <AppLayout>
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 no-print">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800">Scheduled Visits</h1>
          <p className="text-xs text-slate-500">
            Patients scheduled for today ({new Date().toLocaleDateString()})
          </p>
        </div>
        <Button variant="ghost" onClick={() => router.back()}>
          Back to Dashboard
        </Button>
      </nav>

      <main className="p-6">
        {loading ? (
          <div className="text-center py-10 text-slate-500">
            Loading scheduled visits...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {scheduledPatients.map((p: any, index) => (
              <div
                key={`${p.visitId}-${index}`}
                className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => {
                  window.location.href = `/reception/patient/${p.patientID}`;
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-full uppercase tracking-wider">
                      {p.patientID}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800 mt-2 group-hover:text-sky-600 transition-colors">
                      {p.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        p.visitStatus === "waiting"
                          ? "bg-yellow-50 text-yellow-600"
                          : p.visitStatus === "completed"
                            ? "bg-green-50 text-green-600"
                            : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      {p.visitStatus || "Scheduled"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Reason
                    </p>
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {p.visitReason || "Routine Checkup"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Time
                    </p>
                    <p className="text-sm font-medium text-slate-700">
                      {p.visitTime
                        ? new Date(p.visitTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "All Day"}
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-4 flex justify-between items-center text-xs text-slate-400">
                  <span>Mobile: {p.mobile}</span>
                  <span className="text-sky-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    View Details ➔
                  </span>
                </div>
              </div>
            ))}

            {scheduledPatients.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400 italic bg-white rounded-xl border border-slate-100">
                No visits scheduled for today.
              </div>
            )}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
