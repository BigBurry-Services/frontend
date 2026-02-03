"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function IpPatientsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ipPatients, setIpPatients] = useState<any[]>([]);

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

        // Filter for Occupied Beds
        const occupiedBeds = allResources.filter(
          (r: any) => r.isOccupied && r.currentPatientID,
        );

        // Map beds to patients
        const patientsInIp = occupiedBeds
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
          .filter(Boolean); // Remove nulls

        setIpPatients(patientsInIp);
      } catch (error) {
        console.error("Failed to fetch IP patients", error);
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
            In-Patient (IP) List
          </h1>
          <p className="text-xs text-slate-500">Currently admitted patients</p>
        </div>
        <Button variant="ghost" onClick={() => router.back()}>
          Back to Dashboard
        </Button>
      </nav>

      <main className="p-6">
        {loading ? (
          <div className="text-center py-10 text-slate-500">
            Loading IP patients...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ipPatients.map((p: any) => (
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
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-50 text-purple-600 mb-1 block">
                      {p.bedName}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">
                      {p.bedType}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Admitted On
                    </p>
                    <p className="text-sm font-medium text-slate-700">
                      {p.admissionDate
                        ? new Date(p.admissionDate).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Discharge Exp.
                    </p>
                    <p className="text-sm font-medium text-slate-700">
                      {p.expectedDischargeDate
                        ? new Date(p.expectedDischargeDate).toLocaleDateString()
                        : "Not Set"}
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

            {ipPatients.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400 italic bg-white rounded-xl border border-slate-100">
                No patients currently admitted in IP.
              </div>
            )}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
