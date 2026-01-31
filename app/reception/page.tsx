"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import BedView from "@/components/BedView";
import { useEffect, useState } from "react";
import axios from "axios";

export default function ReceptionDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("registration");
  const [patients, setPatients] = useState([]);
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
  const [searchTerm, setSearchTerm] = useState("");

  const [todaysVisits, setTodaysVisits] = useState([]);

  const apiUrl = "/api";

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

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${apiUrl}/patients`, {
        ...formData,
        age: Number(formData.age),
      });
      alert("Patient Registered Successfully");
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
    setVisitReason("");
  };

  const submitVisit = async () => {
    if (selectedDoctors.length === 0)
      return alert("Please select at least one doctor");
    try {
      await axios.post(`${apiUrl}/visits`, {
        patientID: selectedPatient.patientID,
        doctorIDs: selectedDoctors,
        // Backend now expects doctorIDs array
        visitDate: new Date(),
        status: "waiting",
        reason: visitReason,
      });
      alert("Visit Created! Token Generated.");
      setShowVisitModal(false);
    } catch (error) {
      alert("Failed to create visit");
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "receptionist")) {
    return <div className="p-10">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-sky-600">Reception Dashboard</h1>
        <div className="flex gap-4 items-center">
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/reception/billing")}
          >
            Billing
          </Button>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/reception/staff")}
          >
            Manage Staff
          </Button>
          {user.role === "admin" && (
            <Button
              variant="secondary"
              onClick={() => (window.location.href = "/reception/departments")}
            >
              Departments
            </Button>
          )}

          {user.role === "admin" && (
            <Button
              variant="secondary"
              onClick={() => (window.location.href = "/pharmacy")}
            >
              Pharmacy
            </Button>
          )}
          {user.role === "admin" && (
            <Button
              variant="secondary"
              onClick={() => (window.location.href = "/reception/resources")}
            >
              Manage Beds
            </Button>
          )}
          <span className="text-slate-600">Welcome, {user.username}</span>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Bed View Section */}
        <BedView />

        {/* Action Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            Patient Management
          </h2>
          <Button
            onClick={() => setShowRegistrationModal(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white"
          >
            + Register New Patient
          </Button>
        </div>

        {/* Patient List (Full Width) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold text-slate-700">
              Recent Patients
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search patients..."
                className="border rounded px-3 py-1 text-sm focus:outline-none focus:border-sky-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="ghost" onClick={fetchPatients}>
                Refresh
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Age/Gender</th>
                  <th className="px-4 py-3">Contact</th>
                </tr>
              </thead>
              <tbody>
                {patients
                  .filter(
                    (p: any) =>
                      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.patientID
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      p.mobile.includes(searchTerm),
                  )
                  .map((p: any) => {
                    const activeVisit: any = todaysVisits.find(
                      (v: any) => v.patientID === p.patientID,
                    );

                    return (
                      <tr
                        key={p._id}
                        className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${activeVisit ? "bg-sky-50/30" : ""}`}
                        onClick={() => {
                          window.location.href = `/reception/patient/${p.patientID}`;
                        }}
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {p.patientID}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {p.name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {p.age} / {p.gender}
                        </td>
                        <td className="px-4 py-3">{p.mobile}</td>
                      </tr>
                    );
                  })}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-slate-400">
                      No patients found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
                    key={d._id}
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
    </div>
  );
}
