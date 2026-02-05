"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import BedView from "@/components/BedView";
import { useEffect, useState } from "react";
import axios from "axios";
import { AppLayout } from "@/components/AppLayout";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  Users,
  Activity,
  LogOut,
  Search,
  ChevronRight,
  FileSpreadsheet,
  Download,
} from "lucide-react";

export default function ReceptionDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("registration");
  const [patients, setPatients] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState("today");
  const [stats, setStats] = useState({
    scheduledVisits: 0,
    ipPatients: 0,
    upcomingDischarges: 0,
  });
  const [graphData, setGraphData] = useState<any[]>([]);
  const [patientPackages, setPatientPackages] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    mobile: "",
    address: "",
  });

  // UI State
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [visitReason, setVisitReason] = useState("");
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [patientSearch, setPatientSearch] = useState("");

  const [todaysVisits, setTodaysVisits] = useState<any[]>([]);

  const apiUrl = "/api";

  const fetchResources = async () => {
    try {
      const res = await axios.get(`${apiUrl}/resources`);
      setResources(res.data);
    } catch (error) {
      console.error("Failed to fetch resources");
    }
  };

  const fetchPatients = async () => {
    try {
      const [patientsRes, visitsRes] = await Promise.all([
        axios.get(`${apiUrl}/patients`),
        axios.get(`${apiUrl}/visits`),
      ]);
      setPatients(patientsRes.data);
      setTodaysVisits(
        visitsRes.data.filter(
          (v: any) => v.status !== "Completed" && v.status !== "cancelled",
        ),
      );
    } catch (error) {
      console.error("Failed to fetch data");
    }
  };

  const fetchPatientPackages = async () => {
    try {
      const res = await axios.get(`${apiUrl}/patient-packages`);
      setPatientPackages(res.data);
    } catch (error) {
      console.error("Failed to fetch patient packages");
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await axios.get(`${apiUrl}/users?role=doctor`);
      setDoctors(res.data);
    } catch (error) {
      console.error("Failed to fetch doctors");
    }
  };

  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    fetchPatients();
    fetchResources();
    fetchDoctors();
    fetchPatientPackages();
  }, []);

  useEffect(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    let endDate = new Date(todayStart);
    endDate.setHours(23, 59, 59, 999);

    if (dateFilter === "tomorrow") {
      todayStart.setDate(todayStart.getDate() + 1);
      endDate.setDate(endDate.getDate() + 1);
    } else if (dateFilter === "7days") {
      endDate.setDate(endDate.getDate() + 7);
    } else if (dateFilter === "28days") {
      endDate.setDate(endDate.getDate() + 28);
    }

    const visitsCount = todaysVisits.filter((v: any) => {
      const vDate = new Date(v.visitDate || v.createdAt);
      return vDate >= todayStart && vDate <= endDate;
    }).length;

    const ipCount = resources.filter((r: any) => r.isOccupied).length;

    const dischargeCount = resources.filter((r: any) => {
      if (!r.isOccupied || !r.expectedDischargeDate) return false;
      const dDate = new Date(r.expectedDischargeDate);
      return dDate >= todayStart && dDate <= endDate;
    }).length;

    setStats({
      scheduledVisits: visitsCount,
      ipPatients: ipCount,
      upcomingDischarges: dischargeCount,
    });

    const trendData = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayStr = days[d.getDay()];
      const sDay = new Date(d);
      sDay.setHours(0, 0, 0, 0);
      const eDay = new Date(d);
      eDay.setHours(23, 59, 59, 999);
      const dailyCount = todaysVisits.filter((v: any) => {
        const vDate = new Date(v.visitDate || v.createdAt);
        return vDate >= sDay && vDate <= eDay;
      }).length;
      trendData.push({ name: dayStr, visits: dailyCount });
    }
    setGraphData(trendData);
  }, [todaysVisits, resources, dateFilter]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${apiUrl}/patients`, {
        ...formData,
        age: Number(formData.age),
      });
      setFormData({
        name: "",
        age: "",
        gender: "Male",
        mobile: "",
        address: "",
      });
      setShowRegistrationModal(false);
      fetchPatients();
    } catch (error) {
      alert("Registration Failed");
    }
  };

  const submitVisit = async () => {
    if (selectedDoctors.length === 0)
      return alert("Please select at least one doctor");
    try {
      await axios.post(`${apiUrl}/visits`, {
        patientID: selectedPatient.patientID,
        doctorIDs: selectedDoctors,
        visitDate: new Date(visitDate),
        status: "waiting",
        reason: visitReason,
      });
      setShowVisitModal(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create visit");
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "receptionist")) {
    return <div className="p-10">Access Denied</div>;
  }

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.patientID.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.mobile.includes(patientSearch),
  );

  return (
    <AppLayout>
      <main className="p-6 space-y-6">
        {activeTab === "registration" ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="7days">Next 7 Days</SelectItem>
                  <SelectItem value="28days">Next 28 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() =>
                  (window.location.href = "/reception/scheduled-visits")
                }
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Scheduled Visits
                  </CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.scheduledVisits}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    For {dateFilter.replace("days", " days")}
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() =>
                  (window.location.href = "/reception/ip-patients")
                }
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Patients in IP
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.ipPatients}</div>
                  <p className="text-xs text-muted-foreground">
                    Total currently active
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() =>
                  (window.location.href = "/reception/upcoming-discharges")
                }
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Upcoming Discharges
                  </CardTitle>
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.upcomingDischarges}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Expected in {dateFilter.replace("days", " days")}
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-md transition-shadow border-sky-100 bg-sky-50/10"
                onClick={() => router.push("/reception/packages?tab=patients")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Patients on Packages
                  </CardTitle>
                  <Activity className="h-4 w-4 text-sky-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-sky-700">
                    {patientPackages.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active Enrollments
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Scheduled Visits Trend</CardTitle>
                <CardDescription>Next 7 days overview</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={graphData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: "#f1f5f9" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar
                        dataKey="visits"
                        fill="currentColor"
                        className="fill-primary"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : activeTab === "patients" ? (
          <div className="space-y-8 max-w-4xl mx-auto w-full pt-12 animate-in fade-in duration-500">
            <div className="text-center space-y-4">
              <Users className="h-12 w-12 text-primary mx-auto" />
              <h1 className="text-3xl font-black">Patient Records</h1>
              <div className="relative max-w-2xl mx-auto w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  className="pl-14 h-16 text-lg bg-background border-border shadow-sm rounded-2xl"
                  placeholder="Search by Name, ID, or Mobile..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
                {patientSearch && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-background border rounded-2xl shadow-2xl z-50 overflow-hidden text-left">
                    <div className="max-h-[350px] overflow-y-auto">
                      {filteredPatients.slice(0, 10).map((p) => (
                        <div
                          key={p.id}
                          onClick={() =>
                            (window.location.href = `/reception/patient/${p.patientID}`)
                          }
                          className="p-4 hover:bg-muted cursor-pointer flex justify-between items-center border-b last:border-0"
                        >
                          <div>
                            <p className="font-bold">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.patientID} • {p.mobile}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-primary" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  onClick={() => setShowRegistrationModal(true)}
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-8 font-black uppercase tracking-widest border-2 hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  + New Registration
                </Button>
                <Button
                  onClick={() => router.push("/reception/patients")}
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-8 font-black uppercase tracking-widest border-2 hover:bg-sky-600 hover:text-white transition-all text-sky-600 border-sky-600"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> View All Patients
                </Button>
              </div>
            </div>
          </div>
        ) : activeTab === "beds" ? (
          <BedView />
        ) : null}
      </main>

      {showRegistrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Register Patient</h2>
              <button onClick={() => setShowRegistrationModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Gender</Label>
                  <select
                    className="w-full h-10 rounded-md border px-3"
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Mobile</Label>
                <Input
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRegistrationModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Register
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVisitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold">Create Visit</h3>
            <div className="text-sm">
              Patient:{" "}
              <span className="font-semibold">{selectedPatient?.name}</span> (
              {selectedPatient?.patientID})
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Doctors</label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                {doctors.map((d) => (
                  <label
                    key={d.id}
                    className="flex items-center gap-2 text-sm p-1 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDoctors.includes(d.username)}
                      onChange={(e) =>
                        e.target.checked
                          ? setSelectedDoctors([...selectedDoctors, d.username])
                          : setSelectedDoctors(
                              selectedDoctors.filter((id) => id !== d.username),
                            )
                      }
                    />
                    <span>
                      Dr. {d.name} ({d.specialization})
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Visit Date</Label>
              <Input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Reason</Label>
              <Input
                value={visitReason}
                onChange={(e) => setVisitReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
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
