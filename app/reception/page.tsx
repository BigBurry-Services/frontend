"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import BedView from "@/components/BedView";
import { useEffect, useState } from "react";
import axios from "axios";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppLayout } from "@/components/AppLayout";
import { useSearchParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ReceptionDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("registration");
  const [patients, setPatients] = useState([]);
  const [resources, setResources] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState("today");
  const [stats, setStats] = useState({
    scheduledVisits: 0,
    ipPatients: 0,
    upcomingDischarges: 0,
  });
  const [graphData, setGraphData] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    mobile: "",
    address: "",
  });

  // Visit Creation State
  const [doctors, setDoctors] = useState([]);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [visitReason, setVisitReason] = useState("");
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientSort, setPatientSort] = useState("newest");
  const [genderFilter, setGenderFilter] = useState("All");

  const [todaysVisits, setTodaysVisits] = useState([]);

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
        axios.get(`${apiUrl}/visits`), // Fetch all visits (potentially huge in long run but okay for Lite MVP)
      ]);
      setPatients(patientsRes.data);
      // Filter for active visits (waiting or in_consultation)
      setTodaysVisits(
        visitsRes.data.filter(
          (v: any) => v.status !== "Completed" && v.status !== "cancelled",
        ),
      );
    } catch (error) {
      console.error("Failed to fetch data");
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
    if (tab === "patients") {
      setActiveTab("patients");
    } else if (tab === "beds") {
      setActiveTab("beds");
    } else if (tab === "registration") {
      setActiveTab("registration");
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPatients();
    fetchResources(); // Fetch beds/resources
    fetchDoctors();
  }, []);

  // Calculate Stats based on Date Filter
  useEffect(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const dayAfterTomorrowStart = new Date(tomorrowStart);
    dayAfterTomorrowStart.setDate(dayAfterTomorrowStart.getDate() + 1);

    let startDate = todayStart;
    let endDate = new Date(todayStart);
    endDate.setHours(23, 59, 59, 999);

    if (dateFilter === "tomorrow") {
      startDate = tomorrowStart;
      endDate = new Date(tomorrowStart);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateFilter === "7days") {
      startDate = todayStart; // From today
      endDate = new Date(todayStart);
      endDate.setDate(endDate.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateFilter === "28days") {
      startDate = todayStart;
      endDate = new Date(todayStart);
      endDate.setDate(endDate.getDate() + 28);
      endDate.setHours(23, 59, 59, 999);
    }

    // 1. Scheduled Visits (Date Check)
    // Assuming todaysVisits contains ALL relevant future/active visits
    const visitsCount = todaysVisits.filter((v: any) => {
      const vDate = new Date(v.visitDate || v.createdAt); // Fallback to createdAt if visitDate missing
      return vDate >= startDate && vDate <= endDate;
    }).length;

    // 2. IP Patients (Currently Occupied)
    // Note: Usually "Patients in IP" is a static count of current occupancy, independent of filter
    // unless filtering by admission date. We will show Total Occupied across hospital for now,
    // or arguably "Admitted in this period". Let's show TOTAL Current Occupancy as it's most critical.
    const ipCount = resources.filter((r: any) => r.isOccupied).length;

    // 3. Upcoming Discharges (Date Check)
    const dischargeCount = resources.filter((r: any) => {
      if (!r.isOccupied || !r.expectedDischargeDate) return false;
      const dDate = new Date(r.expectedDischargeDate);
      return dDate >= startDate && dDate <= endDate;
    }).length;

    setStats({
      scheduledVisits: visitsCount,
      ipPatients: ipCount,
      upcomingDischarges: dischargeCount,
    });

    // 4. Graph Data (Next 7 Days Trend)
    const trendData = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayStr = days[d.getDay()];

      // Filter visits for this specific day
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);

      const dailyCount = todaysVisits.filter((v: any) => {
        const vDate = new Date(v.visitDate || v.createdAt);
        return vDate >= startOfDay && vDate <= endOfDay;
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

  const openVisitModal = (patient: any) => {
    setSelectedPatient(patient);
    setShowVisitModal(true);
    setSelectedDoctors([]);
    setSelectedPatient(patient);
    setShowVisitModal(true);
    setSelectedDoctors([]);
    setVisitReason("");
    setVisitDate(new Date().toISOString().split("T")[0]);
  };

  const submitVisit = async () => {
    if (selectedDoctors.length === 0)
      return alert("Please select at least one doctor");
    try {
      await axios.post(`${apiUrl}/visits`, {
        patientID: selectedPatient.patientID,
        doctorIDs: selectedDoctors,
        // Backend now expects doctorIDs array
        visitDate: new Date(visitDate),
        status: "waiting",
        reason: visitReason,
      });
      setShowVisitModal(false);
    } catch (error) {
      alert("Failed to create visit");
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "receptionist")) {
    return <div className="p-10">Access Denied</div>;
  }

  return (
    <AppLayout>
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 no-print">
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-bold text-slate-800">
            {activeTab === "registration"
              ? "Reception Overview"
              : activeTab === "patients"
                ? "Patients List"
                : "Bed Status"}
          </h1>
        </div>
        <div className="flex gap-4 items-center">
          <ThemeToggle />
        </div>
      </nav>

      <main className="p-6 space-y-6">
        {activeTab === "registration" ? (
          <>
            {/* Dashboard Stats Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-lg font-bold text-slate-800">
                  Dashboard Overview
                </h3>
                <select
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="7days">Next 7 Days</option>
                  <option value="28days">Next 28 Days</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Card 1 */}
                <div
                  className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 flex flex-col justify-between h-32 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() =>
                    (window.location.href = "/reception/scheduled-visits")
                  }
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                        Scheduled Visits
                      </p>
                      <h4 className="text-3xl font-bold text-slate-800 mt-2">
                        {stats.scheduledVisits}
                      </h4>
                    </div>
                    <div className="p-3 bg-white rounded-full text-blue-500 shadow-sm">
                      {/* Icon placeholder or simple circle */}
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    {dateFilter === "today"
                      ? "For today"
                      : dateFilter === "tomorrow"
                        ? "For tomorrow"
                        : `For next ${dateFilter.replace("days", " days")}`}
                  </p>
                </div>

                {/* Stats Card 2 */}
                <div
                  className="bg-purple-50/50 p-6 rounded-xl border border-purple-100 flex flex-col justify-between h-32 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() =>
                    (window.location.href = "/reception/ip-patients")
                  }
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                        Patients in IP
                      </p>
                      <h4 className="text-3xl font-bold text-slate-800 mt-2">
                        {stats.ipPatients}
                      </h4>
                    </div>
                    <div className="p-3 bg-white rounded-full text-purple-500 shadow-sm">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-2a2 2 0 01-2-2h2.5"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Total currently active
                  </p>
                </div>

                {/* Stats Card 3 */}
                <div
                  className="bg-orange-50/50 p-6 rounded-xl border border-orange-100 flex flex-col justify-between h-32 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() =>
                    (window.location.href = "/reception/upcoming-discharges")
                  }
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                        Upcoming Discharges
                      </p>
                      <h4 className="text-3xl font-bold text-slate-800 mt-2">
                        {stats.upcomingDischarges}
                      </h4>
                    </div>
                    <div className="p-3 bg-white rounded-full text-orange-500 shadow-sm">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    {dateFilter === "today"
                      ? "Expected today"
                      : dateFilter === "tomorrow"
                        ? "Expected tomorrow"
                        : `Expected in next ${dateFilter.replace("days", " days")}`}
                  </p>
                </div>
              </div>

              {/* Graph Section */}
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h4 className="text-sm font-bold text-slate-700 mb-4">
                  Scheduled Visits Trend (Next 7 Days)
                </h4>
                <div className="h-64 w-full">
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
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === "patients" ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">
                Patients List
              </h2>
              <Button
                onClick={() => setShowRegistrationModal(true)}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                + Register New Patient
              </Button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by Name, Patient ID, or Mobile..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <select
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                  >
                    <option value="All">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <select
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    value={patientSort}
                    onChange={(e) => setPatientSort(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {patients
                .filter((p: any) => {
                  const matchesSearch =
                    p.name
                      .toLowerCase()
                      .includes(patientSearch.toLowerCase()) ||
                    p.patientID
                      .toLowerCase()
                      .includes(patientSearch.toLowerCase()) ||
                    p.mobile.includes(patientSearch);
                  const matchesGender =
                    genderFilter === "All" || p.gender === genderFilter;
                  return matchesSearch && matchesGender;
                })
                .sort((a: any, b: any) => {
                  if (patientSort === "newest")
                    return (
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                    );
                  if (patientSort === "oldest")
                    return (
                      new Date(a.createdAt).getTime() -
                      new Date(b.createdAt).getTime()
                    );
                  if (patientSort === "name-asc")
                    return a.name.localeCompare(b.name);
                  if (patientSort === "name-desc")
                    return b.name.localeCompare(a.name);
                  return 0;
                })
                .map((p: any) => (
                  <div
                    key={p.id}
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
                            p.gender === "Male"
                              ? "bg-blue-50 text-blue-600"
                              : p.gender === "Female"
                                ? "bg-pink-50 text-pink-600"
                                : "bg-slate-50 text-slate-600"
                          }`}
                        >
                          {p.gender}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Age
                        </p>
                        <p className="text-sm font-medium text-slate-700">
                          {p.age} Years
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Contact
                        </p>
                        <p className="text-sm font-medium text-slate-700">
                          {p.mobile}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 flex justify-between items-center text-xs text-slate-400">
                      <span>
                        Registered: {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-sky-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details ➔
                      </span>
                    </div>
                  </div>
                ))}

              {patients.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400 italic bg-white rounded-xl border border-slate-100">
                  No patients matching your criteria
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "beds" ? (
          <div className="animate-in fade-in duration-500">
            <BedView />
          </div>
        ) : null}
      </main>

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">
                Register New Patient
              </h2>
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Age"
                    type="number"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                    required
                  />
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Gender
                    </label>
                    <select
                      className="w-full h-10 rounded-md border border-slate-300 px-3 bg-white text-sm"
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
                <Input
                  label="Mobile Number"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                  required
                />
                <Input
                  label="Address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowRegistrationModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Register Patient
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Visit Modal */}
      {showVisitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Create Visit</h3>
            <div className="text-sm text-slate-600">
              Patient:{" "}
              <span className="font-semibold">{selectedPatient?.name}</span> (
              {selectedPatient?.patientID})
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
