"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import axios from "axios";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppLayout } from "@/components/AppLayout";
import { FaUserMd, FaPills, FaMicroscope } from "react-icons/fa";
import { cn } from "@/lib/utils";

// Types
interface Visit {
  id: string;
  tokenNumber: number;
  patientID: string;
  status: string;
  visitDate: string;
  notes?: string;
  reason?: string;
  prescriptions?: { name: string; dosage: string; instruction: string }[];
  updatedAt: string | Date;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<
    "consultation" | "pharma" | "services"
  >("consultation");

  // Shared Data
  const [visits, setVisits] = useState<Visit[]>([]); // Current Queue
  const [medicines, setMedicines] = useState<any[]>([]); // Inventory list
  const [services, setServices] = useState<any[]>([]); // Service catalog
  const [patientCache, setPatientCache] = useState<Record<string, any>>({});

  // Active Consultation State
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [selectedMedicines, setSelectedMedicines] = useState<
    { name: string; dosage: string; instruction: string }[]
  >([]);
  const [selectedServices, setSelectedServices] = useState<
    { name: string; price: number }[]
  >([]);
  const [searchTerm, setSearchTerm] = useState(""); // Medicine search in consultation
  const [serviceSearch, setServiceSearch] = useState(""); // Service search in consultation

  // Global Lookup Search Terms
  const [lookupSearch, setLookupSearch] = useState("");

  const apiUrl = "/api";

  const fetchQueue = async () => {
    try {
      if (!user?.username) return;
      const res = await axios.get(`${apiUrl}/visits`);
      const filtered = res.data.filter((v: Visit) => {
        return (
          (v.status.includes(user?.username || "") &&
            !v.status.includes("Completed")) ||
          v.status === "waiting" ||
          v.status === "in_consultation"
        );
      });
      setVisits(filtered);

      // Fetch patient details for the queue to show names/details
      const uniqueIds = Array.from(
        new Set(filtered.map((v: any) => v.patientID)),
      ) as string[];
      for (const id of uniqueIds) {
        if (!patientCache[id]) {
          try {
            const pRes = await axios.get(`${apiUrl}/patients/${id}`);
            setPatientCache((prev) => ({ ...prev, [id]: pRes.data }));
          } catch (e) {
            console.error(`Failed to fetch patient ${id}`);
          }
        }
      }
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

  const fetchServices = async () => {
    try {
      const res = await axios.get(`${apiUrl}/services`);
      setServices(res.data);
    } catch (e) {
      console.error("Failed to fetch services");
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchMedicines();
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const myConsultation = (visit: any) => {
    if (!user?.username) return null;
    return visit.consultations?.find((c: any) => c.doctorID === user.username);
  };

  useEffect(() => {
    if (selectedVisit && user?.username) {
      const myCons = myConsultation(selectedVisit);
      if (myCons) {
        setNotes(myCons.notes || "");
        setSelectedMedicines(myCons.prescriptions || []);
        setSelectedServices(myCons.services || []);
      } else {
        setNotes(selectedVisit.notes || "");
        setSelectedMedicines(selectedVisit.prescriptions || []);
        setSelectedServices([]);
      }

      // Ensure we have current patient details for the consultation
      axios
        .get(`${apiUrl}/patients/${selectedVisit.patientID}`)
        .then((res) => setPatientDetails(res.data))
        .catch(() => setPatientDetails(null));
    } else {
      setPatientDetails(null);
      setNotes("");
      setSelectedMedicines([]);
      setSelectedServices([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVisit, user]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await axios.patch(`${apiUrl}/visits/${id}/status`, {
        status: newStatus,
        notes: newStatus === "completed" ? notes : undefined,
        prescriptions:
          newStatus === "completed" ? selectedMedicines : undefined,
        services: newStatus === "completed" ? selectedServices : undefined,
        doctorID: user?.username,
      });

      if (newStatus === "completed") {
        setSelectedVisit(null); // This triggers the redirect back to queue
        fetchQueue();
        return;
      }

      fetchQueue();
    } catch (e) {
      alert("Update failed");
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "doctor")) {
    return <div className="p-10 text-center">Access Denied</div>;
  }

  // sidebar Navigation Component
  const NavigationSidebar = (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        Doctor Menu
      </h3>
      <div className="flex flex-col gap-1">
        {[
          { id: "consultation", label: "My Patients", icon: FaUserMd },
          { id: "pharma", label: "Pharma", icon: FaPills },
          { id: "services", label: "Services", icon: FaMicroscope },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveView(item.id as any);
              if (item.id !== "consultation") setLookupSearch("");
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
              activeView === item.id
                ? "bg-sky-500/10 text-sky-400"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white",
            )}
          >
            <item.icon className="text-lg" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AppLayout extraSidebarContent={NavigationSidebar}>
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 no-print">
        <h1 className="text-xl font-bold text-slate-800">Doctor Dashboard</h1>
        <div className="flex gap-4 items-center">
          <span className="text-sm font-medium text-slate-600">
            Dr. {user.username}
          </span>
          <ThemeToggle />
        </div>
      </nav>

      <main className="p-6 h-[calc(100vh-80px)] overflow-y-auto">
        <div
          className={cn(
            "grid gap-6 h-full transition-all duration-300",
            activeView === "consultation" && !selectedVisit
              ? "grid-cols-1 md:grid-cols-3"
              : "grid-cols-1",
          )}
        >
          {/* Queue Column - Only show in Consultation View when NO patient is selected */}
          {activeView === "consultation" && !selectedVisit && (
            <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full overflow-y-auto">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
                Patient Queue
              </h2>
              <div className="space-y-3">
                {visits.map((visit) => {
                  const pInfo = patientCache[visit.patientID];
                  return (
                    <div
                      key={visit.id}
                      onClick={() => {
                        setSelectedVisit(visit);
                      }}
                      className={cn(
                        "p-4 rounded-xl border cursor-pointer transition-all",
                        selectedVisit?.id === visit.id
                          ? "border-sky-500 bg-sky-50 shadow-sm"
                          : "border-slate-100 hover:border-sky-200 hover:bg-slate-50",
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-bold text-slate-800 block text-lg">
                            Token #{visit.tokenNumber}
                          </span>
                          <span className="text-sm font-semibold text-sky-700">
                            {pInfo?.name || "Loading name..."}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                            visit.status === "waiting"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700",
                          )}
                        >
                          {visit.status.includes("Consulting")
                            ? "In Room"
                            : "Waiting"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>ID: {visit.patientID}</span>
                        {pInfo && (
                          <span>
                            {pInfo.age}Y / {pInfo.gender}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {visits.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-slate-400 text-sm italic">
                      No patients in queue
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 text-xs"
                      onClick={fetchQueue}
                    >
                      Refresh Queue
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active View Area */}
          <div
            className={cn(
              "h-full overflow-y-auto transition-all duration-300",
              activeView === "consultation" && !selectedVisit
                ? "md:col-span-2"
                : "col-span-1",
            )}
          >
            {activeView === "consultation" && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-full">
                {selectedVisit ? (
                  <div className="flex flex-col h-full">
                    {/* Back to Queue Button */}
                    <div className="mb-4">
                      <Button
                        variant="ghost"
                        className="text-slate-500 hover:text-sky-600 pl-0 flex items-center gap-2"
                        onClick={() => setSelectedVisit(null)}
                      >
                        ← Back to Patient Queue
                      </Button>
                    </div>
                    {(() => {
                      const currentStatus = selectedVisit.status;
                      if (
                        currentStatus === `Waiting for Dr. ${user.username}` ||
                        currentStatus === "waiting"
                      ) {
                        return (
                          <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-12">
                            <div className="w-full max-w-md bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
                              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                                Token #{selectedVisit.tokenNumber}
                              </h2>
                              <div className="text-slate-600 mb-8 space-y-2">
                                {patientDetails ? (
                                  <>
                                    <p className="text-xl font-semibold text-sky-700">
                                      {patientDetails.name}
                                    </p>
                                    <p className="text-lg font-medium">
                                      {patientDetails.age} Years /{" "}
                                      {patientDetails.gender}
                                    </p>
                                    <p className="text-sm text-slate-400">
                                      Patient ID: {patientDetails.id}
                                    </p>
                                  </>
                                ) : (
                                  <p className="animate-pulse">
                                    Loading patient details...
                                  </p>
                                )}
                              </div>
                              <Button
                                className="w-full py-6 text-xl"
                                onClick={() =>
                                  handleStatusChange(
                                    selectedVisit.id,
                                    "in_consultation",
                                  )
                                }
                              >
                                Start Consultation
                              </Button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center border-b pb-4">
                            <div>
                              <h2 className="text-xl font-bold text-slate-800">
                                Token #{selectedVisit.tokenNumber} -{" "}
                                {patientDetails?.name}
                              </h2>
                              <p className="text-sm text-slate-500">
                                {patientDetails?.age}Y /{" "}
                                {patientDetails?.gender}
                              </p>
                            </div>
                            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                              Consulting
                            </div>
                          </div>

                          {/* Medicine & Service Prescription Blocks */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Medicines
                              </label>
                              <div className="border rounded-xl p-4 bg-slate-50 space-y-3">
                                <input
                                  type="text"
                                  placeholder="Search medicine..."
                                  className="w-full p-2 text-sm border rounded-lg"
                                  value={searchTerm}
                                  onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                  }
                                />
                                <div className="h-40 overflow-y-auto space-y-1">
                                  {medicines
                                    .filter((m) =>
                                      m.name
                                        .toLowerCase()
                                        .includes(searchTerm.toLowerCase()),
                                    )
                                    .map((m) => (
                                      <div
                                        key={m.id}
                                        className="flex justify-between items-center p-2 bg-white rounded border"
                                      >
                                        <span className="text-sm">
                                          {m.name}
                                        </span>
                                        <Button
                                          className="h-7 text-xs px-2 py-0"
                                          onClick={() =>
                                            setSelectedMedicines([
                                              ...selectedMedicines,
                                              {
                                                name: m.name,
                                                dosage: "",
                                                instruction: "",
                                              },
                                            ])
                                          }
                                        >
                                          Add
                                        </Button>
                                      </div>
                                    ))}
                                </div>
                                <div className="pt-2 space-y-2">
                                  {selectedMedicines.map((med, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 bg-sky-50 rounded text-sm flex justify-between items-start"
                                    >
                                      <div>
                                        <p className="font-bold">{med.name}</p>
                                        <div className="flex gap-2 mt-1">
                                          <input
                                            placeholder="Dosage"
                                            className="p-1 text-[10px] w-20 border rounded"
                                            value={med.dosage}
                                            onChange={(e) => {
                                              const next = [
                                                ...selectedMedicines,
                                              ];
                                              next[idx].dosage = e.target.value;
                                              setSelectedMedicines(next);
                                            }}
                                          />
                                          <input
                                            placeholder="Inst."
                                            className="p-1 text-[10px] w-20 border rounded"
                                            value={med.instruction}
                                            onChange={(e) => {
                                              const next = [
                                                ...selectedMedicines,
                                              ];
                                              next[idx].instruction =
                                                e.target.value;
                                              setSelectedMedicines(next);
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <button
                                        className="text-red-500"
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
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Services / Tests
                              </label>
                              <div className="border rounded-xl p-4 bg-slate-50 space-y-3">
                                <input
                                  type="text"
                                  placeholder="Search services..."
                                  className="w-full p-2 text-sm border rounded-lg"
                                  value={serviceSearch}
                                  onChange={(e) =>
                                    setServiceSearch(e.target.value)
                                  }
                                />
                                <div className="h-40 overflow-y-auto space-y-1">
                                  {services
                                    .filter((s) =>
                                      s.name
                                        .toLowerCase()
                                        .includes(serviceSearch.toLowerCase()),
                                    )
                                    .map((s) => (
                                      <div
                                        key={s.id}
                                        className="flex justify-between items-center p-2 bg-white rounded border"
                                      >
                                        <span className="text-sm">
                                          {s.name}
                                        </span>
                                        <Button
                                          className="h-7 text-xs px-2 py-0"
                                          onClick={() =>
                                            setSelectedServices([
                                              ...selectedServices,
                                              { name: s.name, price: s.price },
                                            ])
                                          }
                                        >
                                          Add
                                        </Button>
                                      </div>
                                    ))}
                                </div>
                                <div className="pt-2 space-y-2">
                                  {selectedServices.map((svc, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 bg-amber-50 rounded text-sm flex justify-between items-center"
                                    >
                                      <span className="font-bold">
                                        {svc.name}
                                      </span>
                                      <button
                                        className="text-red-500"
                                        onClick={() =>
                                          setSelectedServices(
                                            selectedServices.filter(
                                              (_, i) => i !== idx,
                                            ),
                                          )
                                        }
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Consultation Notes
                            </label>
                            <textarea
                              className="w-full h-32 p-4 border rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                              placeholder="Symptoms, diagnosis, etc..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                            />
                          </div>

                          <div className="pt-4 border-t flex justify-end">
                            <Button
                              className="px-8 py-6 text-lg bg-green-600 hover:bg-green-700"
                              onClick={() =>
                                handleStatusChange(
                                  selectedVisit.id,
                                  "completed",
                                )
                              }
                            >
                              Finish & Save
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6 py-20 text-center px-10">
                    <div className="w-24 h-24 bg-sky-50 rounded-full flex items-center justify-center mb-4">
                      <FaUserMd className="text-5xl text-sky-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      Welcome back, Dr. {user.username}
                    </h2>
                    <p className="max-w-md text-slate-500">
                      Please select a patient from the queue on the left to view
                      details and start a consultation session.
                    </p>
                    <div className="flex gap-4 mt-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center min-w-[120px]">
                        <p className="text-2xl font-bold text-sky-600">
                          {visits.length}
                        </p>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                          In Queue
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center min-w-[120px]">
                        <p className="text-2xl font-bold text-green-600">
                          {
                            visits.filter((v) => v.status === "in_consultation")
                              .length
                          }
                        </p>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                          In Room
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeView === "pharma" && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-full space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-800">
                    Pharmacy Stock
                  </h2>
                  <input
                    type="text"
                    placeholder="Search medicines..."
                    className="p-2 border rounded-lg w-64 text-sm"
                    value={lookupSearch}
                    onChange={(e) => setLookupSearch(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {medicines
                    .filter((m) =>
                      m.name.toLowerCase().includes(lookupSearch.toLowerCase()),
                    )
                    .map((m) => (
                      <div
                        key={m.id}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-200"
                      >
                        <h3 className="font-bold text-slate-800">{m.name}</h3>
                        <div className="mt-2 text-sm flex justify-between">
                          <span className="text-slate-500">
                            Stock Available:
                          </span>
                          <span
                            className={cn(
                              "font-bold",
                              m.stock < 10 ? "text-red-500" : "text-green-600",
                            )}
                          >
                            {m.stock}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Category: {m.category || "General"}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {activeView === "services" && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-full space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-800">
                    Hospital Services
                  </h2>
                  <input
                    type="text"
                    placeholder="Search services..."
                    className="p-2 border rounded-lg w-64 text-sm"
                    value={lookupSearch}
                    onChange={(e) => setLookupSearch(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services
                    .filter((s) =>
                      s.name.toLowerCase().includes(lookupSearch.toLowerCase()),
                    )
                    .map((s) => (
                      <div
                        key={s.id}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-200"
                      >
                        <h3 className="font-bold text-slate-800">{s.name}</h3>
                        <p className="text-sky-600 font-bold mt-2">
                          Rs. {s.price}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {s.description || "Medical service/test"}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
