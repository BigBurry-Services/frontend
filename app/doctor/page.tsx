"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import axios from "axios";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppLayout } from "@/components/AppLayout";
import { FaUserMd, FaPills, FaMicroscope, FaHistory } from "react-icons/fa";
import { cn, formatDate } from "@/lib/utils";
import { X, Search } from "lucide-react";

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
  consultations?: {
    doctorID: string;
    doctorName: string;
    status: string;
    notes?: string;
    prescriptions: {
      name: string;
      dosage: string;
      instruction: string;
      quantity: number;
    }[];
    services: { name: string; price: number }[];
  }[];
  updatedAt: string | Date;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<
    "consultation" | "pharma" | "services" | "history"
  >("consultation");

  // Shared Data
  const [visits, setVisits] = useState<Visit[]>([]); // Current Queue
  const [medicines, setMedicines] = useState<any[]>([]); // Inventory list
  const [services, setServices] = useState<any[]>([]); // Service catalog
  const [patientCache, setPatientCache] = useState<Record<string, any>>({});

  // Active Consultation State
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);

  // History State
  const [historyVisits, setHistoryVisits] = useState<Visit[]>([]);
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyFilterDate, setHistoryFilterDate] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedMedicines, setSelectedMedicines] = useState<
    { name: string; dosage: string; instruction: string; quantity?: number }[]
  >([]);
  const [selectedServices, setSelectedServices] = useState<
    { name: string; price: number }[]
  >([]);
  const [medicineSearch, setMedicineSearch] = useState(""); // Medicine search in consultation
  const [tokenDateFilter, setTokenDateFilter] = useState("today");
  const [customTokenDate, setCustomTokenDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Global Lookup Search Terms
  const [lookupSearch, setLookupSearch] = useState("");

  const apiUrl = "/api";

  const fetchQueue = async () => {
    try {
      if (!user?.username) return;
      const res = await axios.get(`${apiUrl}/visits`);
      const allVisits = res.data;
      const filtered = allVisits.filter((v: Visit) => {
        // Check if this doctor has a consultation in this visit
        const myConsultation = v.consultations?.find(
          (c) => c.doctorID === user?.username,
        );

        // Date matching logic
        const vDateStr = new Date(v.visitDate).toISOString().split("T")[0];
        const todayStr = new Date().toISOString().split("T")[0];

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];

        let dateMatches = false;
        if (tokenDateFilter === "today") {
          dateMatches = vDateStr === todayStr;
        } else if (tokenDateFilter === "tomorrow") {
          dateMatches = vDateStr === tomorrowStr;
        } else if (tokenDateFilter === "other" && customTokenDate) {
          dateMatches = vDateStr === customTokenDate;
        } else if (tokenDateFilter === "all") {
          dateMatches = true;
        }

        // Only show if I have a consultation AND it's waiting or in progress
        return (
          myConsultation &&
          (myConsultation.status === "waiting" ||
            myConsultation.status === "in_consultation") &&
          dateMatches
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

  const fetchHistory = async () => {
    try {
      if (!user?.username) return;
      setHistoryLoading(true);
      const res = await axios.get(`${apiUrl}/visits`);
      const allVisits = res.data;
      const history = allVisits.filter((v: Visit) => {
        const myConsultation = v.consultations?.find(
          (c) => c.doctorID === user?.username,
        );
        return myConsultation && myConsultation.status === "completed";
      });
      setHistoryVisits(
        history.sort(
          (a: Visit, b: Visit) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
      );

      // Cache patient details for history
      const uniqueIds = Array.from(
        new Set(history.map((v: any) => v.patientID)),
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
      console.error("Failed to fetch history");
    } finally {
      setHistoryLoading(false);
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
    if (activeView === "history") fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeView, tokenDateFilter, customTokenDate]);

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
      const res = await axios.patch(`${apiUrl}/visits/${id}/status`, {
        status: newStatus,
        notes: newStatus === "completed" ? notes : undefined,
        prescriptions:
          newStatus === "completed" ? selectedMedicines : undefined,
        services: newStatus === "completed" ? selectedServices : undefined,
        doctorID: user?.username,
      });

      if (newStatus === "completed") {
        setSelectedVisit(null);
      } else if (selectedVisit && selectedVisit.id === id) {
        // Transition based on actual backend response to ensure full state sync
        setSelectedVisit(res.data);
      }

      fetchQueue();
    } catch (e: any) {
      if (e.response?.data?.message) {
        alert(e.response.data.message);
      } else {
        alert("Update failed");
      }
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "doctor")) {
    return <div className="p-10 text-center">Access Denied</div>;
  }

  // sidebar Navigation Component
  const NavigationSidebar = (
    <div className="space-y-4">
      <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2">
        Doctor Menu
      </h3>
      <div className="flex flex-col gap-1">
        {[
          { id: "consultation", label: "My Patients", icon: FaUserMd },
          { id: "history", label: "History", icon: FaHistory },
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
              "w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-xs transition-all text-left",
              activeView === item.id
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <item.icon className="text-base" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AppLayout extraSidebarContent={NavigationSidebar}>
      <main className="p-1.5 md:p-4 h-[calc(100vh-56px)] overflow-y-auto">
        <div
          className={cn(
            "grid gap-4 h-full transition-all duration-300",
            activeView === "consultation" && !selectedVisit
              ? "grid-cols-1 md:grid-cols-3"
              : "grid-cols-1",
          )}
        >
          {/* Queue Column - Only show in Consultation View when NO patient is selected */}
          {activeView === "consultation" && !selectedVisit && (
            <Card className="md:col-span-1 h-full overflow-y-auto">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest whitespace-nowrap">
                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                    Patient Queue
                  </CardTitle>
                  <Select
                    value={tokenDateFilter}
                    onValueChange={setTokenDateFilter}
                  >
                    <SelectTrigger className="h-7 text-[9px] w-[90px] uppercase font-bold tracking-wider bg-muted/30 border-none">
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="other">Pick Date</SelectItem>
                      <SelectItem value="all">All Dates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {tokenDateFilter === "other" && (
                  <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Input
                      type="date"
                      value={customTokenDate}
                      onChange={(e) => setCustomTokenDate(e.target.value)}
                      className="h-7 text-[10px] bg-muted/10"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {(visits as Visit[]).map((visit) => {
                  const pInfo = patientCache[visit.patientID];
                  return (
                    <div
                      key={visit.id}
                      onClick={() => {
                        setSelectedVisit(visit);
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border cursor-pointer transition-all",
                        (selectedVisit as any)?.id === (visit as any).id
                          ? "bg-secondary text-secondary-foreground border-border shadow-sm"
                          : "border-border hover:bg-accent",
                      )}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <div>
                          <span className="text-foreground block text-base font-bold leading-tight">
                            Token #{visit.tokenNumber}
                          </span>
                          <span className="text-sm font-medium text-muted-foreground">
                            {pInfo?.name}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-[9px] uppercase px-1.5 py-0.5 rounded-full",
                            visit.status === "waiting"
                              ? "bg-muted text-muted-foreground"
                              : "bg-secondary text-secondary-foreground",
                          )}
                        >
                          {visit.status.includes("Consulting")
                            ? "In Room"
                            : "Waiting"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>
                          ID: {visit.patientID} • {formatDate(visit.visitDate)}
                        </span>
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
                  <div className="text-center py-8">
                    <p className="text-slate-400 text-xs italic">
                      No patients in queue
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 text-xs"
                      onClick={fetchQueue}
                    >
                      Refresh Queue
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
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
              <div className="min-h-full">
                <CardContent className="p-6">
                  {!selectedVisit ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-12 text-center px-10">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                        <FaUserMd className="text-4xl text-slate-900" />
                      </div>
                      <h2 className="text-xl text-slate-800">
                        Welcome back, Dr. {user.username}
                      </h2>
                      <p className="max-w-md text-sm text-slate-500">
                        Please select a patient from the queue on the left to
                        view details and start a consultation session.
                      </p>
                      <div className="flex gap-3 mt-3">
                        <Card className="p-2 text-center min-w-[80px] border-border bg-muted/20">
                          <p className="text-lg font-bold text-foreground">
                            {visits.length}
                          </p>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                            In Queue
                          </p>
                        </Card>
                        <Card className="p-2 text-center min-w-[80px] border-border bg-muted/20">
                          <p className="text-lg font-bold text-foreground">
                            {
                              visits.filter(
                                (v) => v.status === "in_consultation",
                              ).length
                            }
                          </p>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                            In Room
                          </p>
                        </Card>
                      </div>
                    </div>
                  ) : selectedVisit.status ===
                      `Waiting for Dr. ${user.username}` ||
                    selectedVisit.status === "waiting" ? (
                    <div className="flex flex-col h-full">
                      <div className="mb-4">
                        <Button
                          variant="ghost"
                          className="text-muted-foreground hover:text-foreground pl-0 flex items-center gap-2 text-sm font-bold uppercase tracking-tight"
                          onClick={() => setSelectedVisit(null)}
                        >
                          ← Back to Patient Queue
                        </Button>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-8">
                        <Card className="w-full max-w-md border-border shadow-lg rounded-2xl overflow-hidden">
                          <CardHeader className="text-center pb-3 bg-muted/20">
                            <CardTitle className="text-3xl font-black">
                              Token #{selectedVisit.tokenNumber}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-center space-y-3 p-4">
                            {patientDetails ? (
                              <div className="space-y-2 py-2">
                                <p className="text-xl font-bold text-foreground">
                                  {patientDetails.name}
                                </p>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                  {patientDetails.age}Y /{" "}
                                  {patientDetails.gender} • ID:{" "}
                                  {patientDetails.id}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs animate-pulse">
                                Loading...
                              </p>
                            )}
                            <Button
                              className="w-full text-sm h-9"
                              onClick={() =>
                                handleStatusChange(
                                  selectedVisit.id,
                                  "in_consultation",
                                )
                              }
                            >
                              Start Consultation
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      <div className="mb-4">
                        <Button
                          variant="ghost"
                          className="text-muted-foreground hover:text-foreground pl-0 flex items-center gap-2 text-sm font-bold uppercase tracking-tight"
                          onClick={() => setSelectedVisit(null)}
                        >
                          ← Back to Patient Queue
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Left Column: Info, Catalogs, and Notes */}
                        <div className="space-y-6 lg:border-r lg:border-border lg:pr-8">
                          <div className="flex justify-between items-center bg-muted/20 p-4 rounded-xl border border-border">
                            <div>
                              <h2 className="text-lg font-bold text-foreground">
                                Token #{selectedVisit.tokenNumber} -{" "}
                                {patientDetails?.name}
                              </h2>
                              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                {patientDetails?.age}Y /{" "}
                                {patientDetails?.gender}
                              </p>
                            </div>
                            <div className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-[9px] uppercase tracking-tight">
                              {selectedVisit.status === "completed" ||
                              myConsultation(selectedVisit)?.status ===
                                "completed"
                                ? "Read Only"
                                : "Consulting"}
                            </div>
                          </div>

                          {/* Catalog Display */}
                          {selectedVisit.status !== "completed" &&
                            myConsultation(selectedVisit)?.status !==
                              "completed" && (
                              <div className="space-y-6 animate-in fade-in duration-300">
                                {/* Medicine Results */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between border-l-4 border-primary pl-4 mb-2">
                                    <div className="flex items-center gap-2">
                                      <FaPills className="text-primary text-base" />
                                      <Label className="text-xs font-bold text-foreground uppercase tracking-widest">
                                        Medicines
                                      </Label>
                                    </div>
                                    <div className="relative w-48">
                                      <Input
                                        type="text"
                                        placeholder=""
                                        className="text-xs h-9 pl-8 pr-8 bg-muted/20 border-border focus:bg-background transition-all rounded-lg"
                                        value={medicineSearch}
                                        onChange={(e) =>
                                          setMedicineSearch(e.target.value)
                                        }
                                      />
                                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                                      {medicineSearch && (
                                        <button
                                          onClick={() => setMedicineSearch("")}
                                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <Card className="bg-background border-border overflow-hidden shadow-sm rounded-xl">
                                    <CardContent className="p-0">
                                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                                        {medicineSearch ? (
                                          medicines
                                            .filter((m) =>
                                              m.name
                                                .toLowerCase()
                                                .includes(
                                                  medicineSearch.toLowerCase(),
                                                ),
                                            )
                                            .map((m) => {
                                              const totalStock =
                                                m.batches?.reduce(
                                                  (sum: number, batch: any) =>
                                                    sum + batch.quantity,
                                                  0,
                                                ) || 0;
                                              const isLowStock =
                                                totalStock < 10;
                                              const isOutOfStock =
                                                totalStock === 0;

                                              return (
                                                <div
                                                  key={m.id}
                                                  className="flex justify-between items-center p-2 hover:bg-accent transition-colors group border-b last:border-0"
                                                >
                                                  <div className="flex-1">
                                                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                                      {m.name}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                      <span
                                                        className={cn(
                                                          "text-[9px] px-1 py-0.5 rounded",
                                                          isOutOfStock
                                                            ? "bg-muted text-muted-foreground"
                                                            : isLowStock
                                                              ? "bg-destructive text-destructive-foreground"
                                                              : "bg-secondary text-secondary-foreground",
                                                        )}
                                                      >
                                                        {totalStock} Left
                                                      </span>
                                                      <span className="text-[9px] text-muted-foreground">
                                                        {m.category}
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-[10px] px-2 border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                                                    disabled={isOutOfStock}
                                                    onClick={() => {
                                                      setSelectedMedicines([
                                                        ...selectedMedicines,
                                                        {
                                                          name: m.name,
                                                          dosage: "",
                                                          instruction: "",
                                                          quantity: 1,
                                                        },
                                                      ]);
                                                      setMedicineSearch("");
                                                    }}
                                                  >
                                                    Add
                                                  </Button>
                                                </div>
                                              );
                                            })
                                        ) : (
                                          <div className="p-10 text-center text-slate-400 italic text-xs flex flex-col items-center gap-2">
                                            <Search className="h-5 w-5 opacity-20" />
                                            Search to find medicines
                                          </div>
                                        )}
                                        {medicineSearch &&
                                          medicines.filter((m) =>
                                            m.name
                                              .toLowerCase()
                                              .includes(
                                                medicineSearch.toLowerCase(),
                                              ),
                                          ).length === 0 && (
                                            <div className="p-6 text-center text-slate-400 italic text-xs">
                                              No matching medicines found
                                            </div>
                                          )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Service Catalog */}
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 border-l-4 border-emerald-500 pl-4 mb-2">
                                    <FaMicroscope className="text-emerald-500 text-base" />
                                    <Label className="text-xs font-bold text-foreground uppercase tracking-widest">
                                      Hospital Services
                                    </Label>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                                    {services.map((s) => (
                                      <Card
                                        key={s.id}
                                        className="flex flex-col justify-between p-2.5 bg-background border-border hover:bg-accent transition-all cursor-pointer group"
                                        onClick={() => {
                                          if (
                                            !selectedServices.find(
                                              (prev) => prev.name === s.name,
                                            )
                                          ) {
                                            setSelectedServices([
                                              ...selectedServices,
                                              { name: s.name, price: s.price },
                                            ]);
                                          }
                                        }}
                                      >
                                        <div className="space-y-1">
                                          <h4 className="text-xs font-bold text-foreground line-clamp-1">
                                            {s.name}
                                          </h4>
                                          <p className="text-[11px] font-bold text-primary">
                                            Rs. {s.price}
                                          </p>
                                        </div>
                                        <div className="mt-1 flex justify-end">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 px-1.5 text-[9px] text-muted-foreground hover:text-foreground hover:bg-background rounded-sm transition-all"
                                          >
                                            + Add
                                          </Button>
                                        </div>
                                      </Card>
                                    ))}
                                    {services.length === 0 && (
                                      <div className="col-span-full p-6 bg-white rounded-lg border border-dashed text-center text-slate-400 italic text-xs">
                                        No services available
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest block">
                              Consultation Notes
                            </Label>
                            <textarea
                              className="w-full h-24 p-4 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm bg-muted/10 hover:bg-muted/20 transition-all resize-none italic"
                              placeholder=""
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              disabled={
                                selectedVisit.status === "completed" ||
                                myConsultation(selectedVisit)?.status ===
                                  "completed"
                              }
                            />
                          </div>
                        </div>

                        {/* Right Column: Selected Items Summary */}
                        <div className="space-y-6 bg-muted/5 p-4 rounded-xl border border-dashed border-border h-fit sticky top-0">
                          {/* Selected Medicines List */}
                          <div className="space-y-3">
                            <Label className="text-xs font-black text-foreground uppercase flex items-center gap-2 mb-2 p-1 border-b">
                              <FaPills className="text-primary" />
                              Current Prescription ({selectedMedicines.length})
                            </Label>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                              {selectedMedicines.map((med, idx) => (
                                <div
                                  key={idx}
                                  className="group relative p-3 bg-card border border-border shadow-sm rounded-xl transition-all duration-200"
                                >
                                  <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-black text-foreground">
                                      {med.name}
                                    </span>
                                    {selectedVisit.status !== "completed" &&
                                      myConsultation(selectedVisit)?.status !==
                                        "completed" && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-slate-300 hover:text-destructive hover:bg-destructive/10 rounded-full"
                                          onClick={() => {
                                            setSelectedMedicines(
                                              selectedMedicines.filter(
                                                (_, i) => i !== idx,
                                              ),
                                            );
                                          }}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      )}
                                  </div>
                                  <div className="grid grid-cols-12 gap-3 mb-3">
                                    <div className="col-span-8">
                                      <Label className="text-[9px] text-muted-foreground font-black uppercase mb-1 block tracking-widest">
                                        Dosage
                                      </Label>
                                      <Input
                                        placeholder=""
                                        className="h-8 text-[11px] bg-muted/20 border-border focus:bg-background transition-all rounded-lg"
                                        value={med.dosage}
                                        disabled={
                                          selectedVisit.status ===
                                            "completed" ||
                                          myConsultation(selectedVisit)
                                            ?.status === "completed"
                                        }
                                        onChange={(e) => {
                                          const next = [...selectedMedicines];
                                          next[idx].dosage = e.target.value;
                                          setSelectedMedicines(next);
                                        }}
                                      />
                                    </div>
                                    <div className="col-span-4">
                                      <Label className="text-[9px] text-muted-foreground font-black uppercase mb-1 block tracking-widest text-center">
                                        Qty
                                      </Label>
                                      <Input
                                        type="number"
                                        className="h-8 text-[11px] bg-muted/20 border-border focus:bg-background transition-all rounded-lg text-center font-bold"
                                        value={med.quantity || ""}
                                        disabled={
                                          selectedVisit.status ===
                                            "completed" ||
                                          myConsultation(selectedVisit)
                                            ?.status === "completed"
                                        }
                                        onChange={(e) => {
                                          const inputValue = Number(
                                            e.target.value,
                                          );
                                          const medicine = medicines.find(
                                            (m) => m.name === med.name,
                                          );
                                          const availableStock =
                                            medicine?.batches?.reduce(
                                              (sum: number, b: any) =>
                                                sum + b.quantity,
                                              0,
                                            ) || 0;

                                          if (inputValue > availableStock) {
                                            alert(
                                              `Only ${availableStock} units available`,
                                            );
                                            return;
                                          }
                                          const next = [...selectedMedicines];
                                          next[idx].quantity = inputValue;
                                          setSelectedMedicines(next);
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] text-muted-foreground font-black uppercase block tracking-widest">
                                      Detailed Instructions
                                    </Label>
                                    <textarea
                                      className="w-full min-h-[40px] p-2.5 text-[11px] bg-muted/10 border border-border focus:bg-background transition-all rounded-lg focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none overflow-hidden italic leading-relaxed"
                                      value={med.instruction}
                                      rows={1}
                                      disabled={
                                        selectedVisit.status === "completed" ||
                                        myConsultation(selectedVisit)
                                          ?.status === "completed"
                                      }
                                      onChange={(e) => {
                                        const next = [...selectedMedicines];
                                        next[idx].instruction = e.target.value;
                                        setSelectedMedicines(next);

                                        // Auto-resize
                                        e.target.style.height = "inherit";
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                      }}
                                      onFocus={(e) => {
                                        e.target.style.height = "inherit";
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                              {selectedMedicines.length === 0 && (
                                <div className="py-8 px-6 border border-dashed rounded-xl text-center text-slate-400 text-xs italic">
                                  No medicines added yet
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Selected Services List */}
                          <div className="space-y-3">
                            <Label className="text-xs font-black text-foreground uppercase flex items-center gap-2 mb-2 p-1 border-b">
                              <FaMicroscope className="text-emerald-500" />
                              Selected Services ({selectedServices.length})
                            </Label>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                              {selectedServices.map((svc, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-card border border-border shadow-sm rounded-xl flex justify-between items-center transition-all duration-200"
                                >
                                  <div>
                                    <span className="text-foreground block text-sm font-black">
                                      {svc.name}
                                    </span>
                                    <span className="text-[11px] font-black text-primary">
                                      Rs. {svc.price}
                                    </span>
                                  </div>
                                  {selectedVisit.status !== "completed" &&
                                    myConsultation(selectedVisit)?.status !==
                                      "completed" && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-300 hover:text-destructive hover:bg-destructive/10 rounded-full"
                                        onClick={() =>
                                          setSelectedServices(
                                            selectedServices.filter(
                                              (_, i) => i !== idx,
                                            ),
                                          )
                                        }
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    )}
                                </div>
                              ))}
                              {selectedServices.length === 0 && (
                                <div className="py-6 px-6 border border-dashed rounded-xl text-center text-slate-400 text-xs italic">
                                  No services/tests added yet
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-6 border-t">
                            {selectedVisit.status !== "completed" &&
                            myConsultation(selectedVisit)?.status !==
                              "completed" ? (
                              <Button
                                className="w-full h-12 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-transform active:scale-95"
                                onClick={() =>
                                  handleStatusChange(
                                    selectedVisit.id,
                                    "completed",
                                  )
                                }
                              >
                                Finish & Save Consultation
                              </Button>
                            ) : (
                              <div className="w-full py-4 text-center bg-muted/30 rounded-xl border border-dashed border-border">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                  Historical Record (Read Only)
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
            )}

            {activeView === "history" && (
              <Card className="min-h-full border-border shadow-sm rounded-xl">
                <CardContent className="p-6 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                    <div>
                      <h2 className="text-base font-black text-foreground uppercase tracking-widest">
                        Consultation History
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        View and search your previous patient consultations
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Input
                          type="text"
                          placeholder="Search patient name or ID..."
                          className="text-sm h-10 pl-10 bg-muted/20 border-border focus:bg-background transition-all rounded-lg"
                          value={historySearchTerm}
                          onChange={(e) => setHistorySearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                          Date:
                        </Label>
                        <Input
                          type="date"
                          className="text-sm h-10 bg-muted/20 border-border focus:bg-background transition-all rounded-lg w-auto"
                          value={historyFilterDate}
                          onChange={(e) => setHistoryFilterDate(e.target.value)}
                        />
                        {historyFilterDate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 text-muted-foreground"
                            onClick={() => setHistoryFilterDate("")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {historyLoading ? (
                      <div className="py-20 text-center animate-pulse">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Loading History...
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {historyVisits
                          .filter((v) => {
                            const pInfo = patientCache[v.patientID];
                            const matchesSearch =
                              !historySearchTerm ||
                              pInfo?.name
                                ?.toLowerCase()
                                .includes(historySearchTerm.toLowerCase()) ||
                              v.patientID
                                .toLowerCase()
                                .includes(historySearchTerm.toLowerCase());

                            const visitDateStr = new Date(v.visitDate)
                              .toISOString()
                              .split("T")[0];
                            const matchesDate =
                              !historyFilterDate ||
                              visitDateStr === historyFilterDate;

                            return matchesSearch && matchesDate;
                          })
                          .map((v) => {
                            const pInfo = patientCache[v.patientID];
                            const myCons = v.consultations?.find(
                              (c) => c.doctorID === user?.username,
                            );

                            return (
                              <Card
                                key={v.id}
                                className="p-5 bg-background border-border hover:border-primary/50 transition-all rounded-2xl group relative overflow-hidden"
                              >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                  <FaUserMd className="text-4xl" />
                                </div>
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                      <span className="bg-primary/5 text-primary text-[10px] font-black px-2 py-0.5 rounded border border-primary/10 tracking-widest">
                                        Token #{v.tokenNumber}
                                      </span>
                                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        {formatDate(v.updatedAt)}
                                      </span>
                                    </div>
                                    <div>
                                      <h3 className="font-black text-lg text-foreground group-hover:text-primary transition-colors">
                                        {pInfo?.name || "Loading..."}
                                      </h3>
                                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        ID: {v.patientID} • {pInfo?.age}Y /{" "}
                                        {pInfo?.gender}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                      {myCons?.prescriptions.map((m, i) => (
                                        <span
                                          key={i}
                                          className="text-[9px] bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded-full font-bold border border-secondary"
                                        >
                                          {m.name}
                                        </span>
                                      ))}
                                      {myCons?.services.map((s, i) => (
                                        <span
                                          key={i}
                                          className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                                        >
                                          {s.name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="md:text-right flex flex-col justify-between items-start md:items-end">
                                    <div className="space-y-1">
                                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">
                                        Clinical Notes
                                      </Label>
                                      <p className="text-xs italic text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm line-clamp-3 md:line-clamp-none">
                                        "
                                        {myCons?.notes ||
                                          "No clinical notes entered."}
                                        "
                                      </p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mt-4 text-[10px] font-black uppercase tracking-widest h-8 border-border hover:bg-muted"
                                      onClick={() => {
                                        // Potential feature: Re-open consultation for editing or view details
                                        // For now, just show patient details could be enough
                                        setActiveView("consultation");
                                        setSelectedVisit(v);
                                      }}
                                    >
                                      View Details
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        {historyVisits.length === 0 && !historyLoading && (
                          <div className="py-20 text-center text-muted-foreground bg-muted/5 border-2 border-dashed border-border rounded-2xl">
                            <FaHistory className="mx-auto h-12 w-12 opacity-5 mb-4" />
                            <p className="font-black uppercase text-[10px] tracking-widest">
                              No consultation history found
                            </p>
                            <p className="text-[11px] mt-1">
                              Patients you've fully consulted will appear here.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeView === "pharma" && (
              <Card className="min-h-full border-border shadow-sm rounded-xl">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h2 className="text-base font-bold text-foreground uppercase tracking-widest">
                      Pharmacy Stock
                    </h2>
                    <div className="relative w-64">
                      <Input
                        type="text"
                        placeholder=""
                        className="text-sm h-10 pl-10 bg-muted/20 border-border focus:bg-background transition-all rounded-lg"
                        value={lookupSearch}
                        onChange={(e) => setLookupSearch(e.target.value)}
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {medicines
                      .filter((m) =>
                        m.name
                          .toLowerCase()
                          .includes(lookupSearch.toLowerCase()),
                      )
                      .map((m) => (
                        <Card
                          key={m.id}
                          className="p-4 bg-background border-border hover:shadow-md transition-all rounded-xl"
                        >
                          <h3 className="font-bold text-sm text-foreground">
                            {m.name}
                          </h3>
                          <div className="mt-2 text-xs flex justify-between">
                            <span className="text-muted-foreground font-medium uppercase tracking-tighter">
                              Stock:
                            </span>
                            <span
                              className={cn(
                                "font-black",
                                m.stock < 10
                                  ? "text-red-500"
                                  : "text-emerald-500",
                              )}
                            >
                              {m.stock}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">
                            {m.category}
                          </p>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeView === "services" && (
              <Card className="min-h-full border-border shadow-sm rounded-xl">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h2 className="text-base font-bold text-foreground uppercase tracking-widest">
                      Hospital Services
                    </h2>
                    <div className="relative w-64">
                      <Input
                        type="text"
                        placeholder=""
                        className="text-sm h-10 pl-10 bg-muted/20 border-border focus:bg-background transition-all rounded-lg"
                        value={lookupSearch}
                        onChange={(e) => setLookupSearch(e.target.value)}
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {services
                      .filter((s) =>
                        s.name
                          .toLowerCase()
                          .includes(lookupSearch.toLowerCase()),
                      )
                      .map((s) => (
                        <Card
                          key={s.id}
                          className="p-4 bg-background border-border hover:shadow-md transition-all rounded-xl"
                        >
                          <h3 className="font-bold text-sm text-foreground">
                            {s.name}
                          </h3>
                          <p className="text-primary font-black mt-2 text-sm">
                            Rs. {s.price}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {s.description || "Medical service/test"}
                          </p>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
