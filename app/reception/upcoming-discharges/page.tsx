"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function UpcomingDischargesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dischargePatients, setDischargePatients] = useState<any[]>([]);

  const apiUrl = "/api";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, resourcesRes] = await Promise.all([
          axios.get(`${apiUrl}/patients`),
          axios.get(`${apiUrl}/resources`),
        ]);

        const allPatients = patientsRes.data;
        const allResources = resourcesRes.data;

        // Filter for Upcoming Discharges (Today onwards)
        const now = new Date();
        const startOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );

        const dischargingBeds = allResources.filter((r: any) => {
          if (!r.isOccupied || !r.currentPatientID || !r.expectedDischargeDate)
            return false;
          return new Date(r.expectedDischargeDate) >= startOfDay;
        });

        // Map beds to patients
        const patientsDischarging = dischargingBeds
          .map((bed: any) => {
            const patient = allPatients.find(
              (p: any) => p.patientID === bed.currentPatientID,
            );
            if (!patient) return null;
            return {
              ...patient,
              bedName: bed.name,
              bedType: bed.type,
              admissionDate: bed.admissionDate,
              expectedDischargeDate: bed.expectedDischargeDate,
              bedId: bed.resourceID,
            };
          })
          .filter(Boolean);

        // Sort by discharge date asc
        patientsDischarging.sort(
          (a: any, b: any) =>
            new Date(a.expectedDischargeDate).getTime() -
            new Date(b.expectedDischargeDate).getTime(),
        );

        setDischargePatients(patientsDischarging);
      } catch (error) {
        console.error("Failed to fetch discharge patients", error);
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
          <h1 className="text-xl font-bold text-slate-800">
            Upcoming Discharges
          </h1>
          <p className="text-xs text-slate-500">
            Patients scheduled for discharge
          </p>
        </div>
        <Button variant="ghost" onClick={() => router.back()}>
          Back to Dashboard
        </Button>
      </nav>

      <main className="p-6">
        {loading ? (
          <div className="text-center py-10 text-slate-500">
            Loading discharge list...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dischargePatients.map((p: any) => {
              const dischargeDate = new Date(p.expectedDischargeDate);
              const isToday =
                new Date().toDateString() === dischargeDate.toDateString();

              return (
                <div
                  key={p.bedId}
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
                        className={`text-xs font-bold px-2 py-1 rounded-full mb-1 block ${isToday ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {isToday ? "Today" : dischargeDate.toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Bed Location
                      </p>
                      <p className="text-sm font-medium text-slate-700">
                        {p.bedName} ({p.bedType})
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Admitted
                      </p>
                      <p className="text-sm font-medium text-slate-700">
                        {p.admissionDate
                          ? new Date(p.admissionDate).toLocaleDateString()
                          : "-"}
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
              );
            })}

            {dischargePatients.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400 italic bg-white rounded-xl border border-slate-100">
                No upcoming discharges found.
              </div>
            )}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
