"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { formatDate } from "@/lib/utils";
import {
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Eye,
  Upload,
  X,
  FileIcon,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PatientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [id, setId] = useState<string>("");

  const [doctors, setDoctors] = useState<any[]>([]);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [visitReason, setVisitReason] = useState("");
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [editingVisit, setEditingVisit] = useState<any>(null);
  const [visitStatus, setVisitStatus] = useState("Waiting");
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [editPatientFormData, setEditPatientFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    mobile: "",
    address: "",
  });

  // Package Management State
  const [packages, setPackages] = useState<any[]>([]);
  const [activePackages, setActivePackages] = useState<any[]>([]);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [packageStartDate, setPackageStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [packageEndDate, setPackageEndDate] = useState("");

  // Document Management State
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${apiUrl}/patients/${id}/documents`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setDocuments((prev) => [...prev, res.data]);
      // Update local patient state too
      setPatient((prev: any) => ({
        ...prev,
        documents: [...(prev.documents || []), res.data],
      }));
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to upload document";
      alert(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await axios.delete(`${apiUrl}/patients/${id}/documents?docId=${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setPatient((prev: any) => ({
        ...prev,
        documents: (prev.documents || []).filter((d: any) => d.id !== docId),
      }));
    } catch (error) {
      alert("Failed to delete document");
    }
  };

  useEffect(() => {
    params.then((unwrapped) => setId(unwrapped.id));
  }, [params]);

  const apiUrl = "/api";

  useEffect(() => {
    // Fetch Doctors
    axios
      .get(`${apiUrl}/users?role=doctor`)
      .then((res) => setDoctors(res.data))
      .catch(console.error);
  }, []);

  const openEditVisit = (visit: any) => {
    setEditingVisit(visit);
    setSelectedDoctors(visit.doctorIDs || []);
    setVisitReason(visit.reason || "");
    setVisitDate(new Date(visit.visitDate).toISOString().split("T")[0]);
    setVisitStatus(visit.status || "Waiting");
    setShowVisitModal(true);
  };

  const toggleEditPatientModal = () => {
    if (patient) {
      setEditPatientFormData({
        name: patient.name,
        age: patient.age.toString(),
        gender: patient.gender,
        mobile: patient.mobile,
        address: patient.address || "",
      });
    }
    setShowEditPatientModal(!showEditPatientModal);
  };

  const handleUpdatePatient = async () => {
    try {
      const res = await axios.put(`${apiUrl}/patients/${id}`, {
        ...editPatientFormData,
        age: Number(editPatientFormData.age),
      });
      setPatient(res.data);
      setShowEditPatientModal(false);
    } catch (error) {
      alert("Failed to update patient details");
    }
  };

  const exportVisitsToCSV = () => {
    const headers = ["Token", "Date", "Status", "Reason", "Doctors"];
    const csvData = visits.map((v) =>
      [
        v.tokenNumber,
        formatDate(v.visitDate),
        v.status,
        `"${v.reason || ""}"`,
        `"${v.consultations?.map((c: any) => c.doctorName).join("; ") || "N/A"}"`,
      ].join(","),
    );

    const csvString = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Visits_${patient?.name}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const submitVisit = async () => {
    if (selectedDoctors.length === 0)
      return alert("Please select at least one doctor");
    try {
      if (editingVisit) {
        await axios.patch(`${apiUrl}/visits/${editingVisit.id}`, {
          patientID: id,
          doctorIDs: selectedDoctors,
          visitDate: new Date(visitDate),
          reason: visitReason,
          status: visitStatus,
        });
      } else {
        await axios.post(`${apiUrl}/visits`, {
          patientID: id,
          doctorIDs: selectedDoctors,
          visitDate: new Date(visitDate),
          reason: visitReason,
        });
      }
      setShowVisitModal(false);
      setEditingVisit(null);
      setSelectedDoctors([]);
      setVisitReason("");
      setVisitDate(new Date().toISOString().split("T")[0]);
      const visitsRes = await axios.get(`${apiUrl}/visits?patientID=${id}`);
      setVisits(visitsRes.data);
    } catch (error: any) {
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert(
          editingVisit ? "Failed to update visit" : "Failed to create visit",
        );
      }
    }
  };

  const submitPackageEnrollment = async () => {
    if (!selectedPackageId) return alert("Please select a package");
    const pkg = packages.find((p: any) => p.id === selectedPackageId);
    if (!pkg) return;
    try {
      await axios.post(`${apiUrl}/patient-packages`, {
        patientID: id,
        patientName: patient.name,
        packageID: pkg.id,
        packageName: pkg.name,
        startDate: packageStartDate,
        endDate: packageEndDate || undefined,
      });

      setShowPackageModal(false);
      setSelectedPackageId("");
      const res = await axios.get(`${apiUrl}/patient-packages`);
      setActivePackages(res.data.filter((ap: any) => ap.patientID === id));
    } catch (error) {
      alert("Failed to enroll patient in package");
    }
  };

  const handleRemovePackage = async (assignmentId: string) => {
    if (
      !confirm("Are you sure you want to remove this package from the patient?")
    )
      return;
    try {
      await axios.delete(`${apiUrl}/patient-packages?id=${assignmentId}`);
      setActivePackages(activePackages.filter((ap) => ap.id !== assignmentId));
    } catch (error) {
      alert("Failed to remove package");
    }
  };

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [patientRes, visitsRes, packagesRes, activePkgsRes] =
          await Promise.all([
            axios.get(`${apiUrl}/patients/${id}`),
            axios.get(`${apiUrl}/visits?patientID=${id}`),
            axios.get(`${apiUrl}/packages`),
            axios.get(`${apiUrl}/patient-packages`),
          ]);
        setPatient(patientRes.data);
        setDocuments(patientRes.data.documents || []);
        setVisits(visitsRes.data);
        setPackages(packagesRes.data);
        setActivePackages(
          activePkgsRes.data.filter((ap: any) => ap.patientID === id),
        );
      } catch (error) {
        console.error("Failed to fetch data");
      }
    };
    fetchData();
  }, [id, apiUrl]);

  if (!user || (user.role !== "admin" && user.role !== "receptionist")) {
    return <div className="p-10">Access Denied</div>;
  }

  if (!patient) return <div className="p-10">Loading...</div>;

  return (
    <AppLayout>
      <nav className="bg-background border-b border-border px-4 py-3 flex justify-between items-center no-print">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="h-8 text-xs"
          >
            ← Back
          </Button>
          <h1 className="text-sm font-semibold text-foreground">
            Patient Details
          </h1>
        </div>
        <div>
          <Button
            size="sm"
            onClick={() => setShowVisitModal(true)}
            className="h-8 text-xs uppercase tracking-wider"
          >
            + New Visit
          </Button>
        </div>
      </nav>

      <main className="p-2 md:p-6 space-y-6 w-full">
        {/* Patient Info Card */}
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {patient.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">
                    {patient.name}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-primary rounded-full"
                    onClick={toggleEditPatientModal}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                  </Button>
                </div>
                <p className="text-muted-foreground font-mono text-sm">
                  {patient.patientID}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-x-8 gap-y-1 text-sm">
              <div className="flex flex-col md:items-end">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">
                  Demographics
                </span>
                <span className="text-foreground">
                  {patient.age} years / {patient.gender}
                </span>
              </div>
              <div className="flex flex-col md:items-end">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">
                  Contact
                </span>
                <span className="text-foreground">{patient.mobile}</span>
              </div>
              <div className="flex flex-col md:items-end md:col-span-1 col-span-2">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">
                  Address
                </span>
                <span className="text-foreground text-right">
                  {patient.address}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Packages Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
              Active Medical Packages
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] font-black uppercase tracking-tighter"
              onClick={() => setShowPackageModal(true)}
            >
              + Enroll In Package
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePackages.length > 0 ? (
              activePackages.map((ap: any) => (
                <div
                  key={ap.id}
                  className="bg-card p-4 rounded-xl border border-sky-100 shadow-sm flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {ap.packageName}
                      </h4>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                        {formatDate(ap.startDate)}{" "}
                        {ap.endDate
                          ? `to ${formatDate(ap.endDate)}`
                          : "(No End Date)"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                    onClick={() => handleRemovePackage(ap.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </Button>
                </div>
              ))
            ) : (
              <div className="md:col-span-2 text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-muted-foreground font-medium italic">
                  Patient is not enrolled in any medical package
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Documents Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
              Attached Documents
            </h3>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-7 text-[10px] font-black uppercase tracking-tighter"
                  disabled={isUploading}
                >
                  <span>
                    {isUploading ? "Uploading..." : "+ Attach Document"}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {documents.length > 0 ? (
              documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="bg-card p-3 rounded-xl border border-border shadow-sm flex flex-col group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary overflow-hidden">
                      {doc.type.includes("image") ? (
                        <img
                          src={doc.url}
                          alt={doc.name}
                          className="h-full w-full object-cover transition-transform hover:scale-110 cursor-zoom-in"
                          onClick={() => setSelectedDoc(doc)}
                        />
                      ) : (
                        <FileIcon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteDoc(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p
                      className="text-xs font-bold text-foreground truncate"
                      title={doc.name}
                    >
                      {doc.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                      {(doc.size / 1024).toFixed(1)} KB •{" "}
                      {formatDate(doc.uploadedAt)}
                    </p>
                  </div>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-[10px] uppercase font-bold"
                      asChild
                    >
                      <a href={doc.url} download={doc.name}>
                        <Download className="h-3 w-3 mr-1" /> Download
                      </a>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="sm:col-span-2 lg:col-span-4 text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-muted-foreground font-medium italic">
                  No documents attached yet
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Visits History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
              Visit History & Consultations
            </h3>
            <div className="flex items-center gap-2 no-print">
              <Button
                onClick={exportVisitsToCSV}
                variant="outline"
                size="sm"
                className="h-7 text-[10px] font-black uppercase border-sky-200 text-sky-700 bg-sky-50 transition-all hover:bg-sky-100"
              >
                <FileSpreadsheet className="w-3 h-3 mr-1" /> Export CSV
              </Button>
              <Button
                onClick={() => window.print()}
                variant="outline"
                size="sm"
                className="h-7 text-[10px] font-black uppercase transition-all hover:bg-slate-100"
              >
                <Printer className="w-3 h-3 mr-1" /> Print / PDF
              </Button>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-bold">
                {visits.length} Visits
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visits.map((v: any) => (
              <div
                key={v.id}
                className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                <div className="p-4 flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="bg-muted h-10 w-10 rounded-lg flex flex-col items-center justify-center border border-border shrink-0">
                      <span className="text-[10px] uppercase text-muted-foreground font-bold leading-none mb-0.5">
                        Tkn
                      </span>
                      <span className="text-sm font-bold text-foreground leading-none">
                        #{v.tokenNumber}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest ${v.status.toLowerCase() === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {v.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-foreground tabular-nums">
                      {formatDate(v.visitDate)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">
                        Assigned Doctors
                      </p>
                      <p className="text-xs text-foreground line-clamp-2 min-h-[2.5rem]">
                        {v.consultations
                          ?.map((c: any) => `Dr. ${c.doctorName || c.doctorID}`)
                          .join(", ") ||
                          `Dr. ${v.doctorIDs?.join(", ") || "Unknown"}`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-muted/30 border-t border-border flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-[10px] uppercase tracking-wider font-bold bg-background"
                    onClick={() => openEditVisit(v)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-[10px] uppercase tracking-wider font-bold"
                    onClick={() => router.push(`/reception/visit/${v.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Visit Modal */}
      {showVisitModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-xl border border-slate-900 max-w-sm w-full p-5 space-y-4">
            <h3 className="text-sm text-foreground uppercase tracking-widest">
              {editingVisit ? "Edit Visit" : "Create Visit"}
            </h3>
            <div className="space-y-4">
              <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-1.5 space-y-1 bg-muted/20">
                {doctors.map((d: any) => (
                  <label
                    key={d.id}
                    className="flex items-center gap-2 text-xs cursor-pointer hover:bg-accent p-1.5 rounded-md"
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
                      className="rounded h-3.5 w-3.5"
                    />
                    <span>
                      Dr. {d.name} ({d.specialization})
                    </span>
                  </label>
                ))}
              </div>
              <input
                type="date"
                className="w-full p-2 h-8 text-xs border border-border rounded-md"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
              <textarea
                className="w-full p-2 text-xs border border-border rounded-md resize-none"
                placeholder="Reason..."
                rows={2}
                value={visitReason}
                onChange={(e) => setVisitReason(e.target.value)}
              />
              {editingVisit && (
                <select
                  className="w-full p-2 h-8 text-xs border border-border rounded-md"
                  value={visitStatus}
                  onChange={(e) => setVisitStatus(e.target.value)}
                >
                  <option value="Waiting">Waiting</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Completed">Completed</option>
                </select>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-8 text-xs uppercase"
                onClick={() => setShowVisitModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-8 text-xs uppercase"
                onClick={submitVisit}
              >
                {editingVisit ? "Update" : "Create Token"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {showEditPatientModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-xl border border-border shadow-lg max-w-sm w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
              Edit Patient Details
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                className="w-full p-2 h-9 text-xs border border-border rounded-md"
                value={editPatientFormData.name}
                onChange={(e) =>
                  setEditPatientFormData({
                    ...editPatientFormData,
                    name: e.target.value,
                  })
                }
                placeholder="Full Name"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  className="w-full p-2 h-9 text-xs border border-border rounded-md"
                  value={editPatientFormData.age}
                  onChange={(e) =>
                    setEditPatientFormData({
                      ...editPatientFormData,
                      age: e.target.value,
                    })
                  }
                  placeholder="Age"
                />
                <select
                  className="w-full p-2 h-9 text-xs border border-border rounded-md"
                  value={editPatientFormData.gender}
                  onChange={(e) =>
                    setEditPatientFormData({
                      ...editPatientFormData,
                      gender: e.target.value,
                    })
                  }
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <input
                type="text"
                className="w-full p-2 h-9 text-xs border border-border rounded-md"
                value={editPatientFormData.mobile}
                onChange={(e) =>
                  setEditPatientFormData({
                    ...editPatientFormData,
                    mobile: e.target.value,
                  })
                }
                placeholder="Mobile"
              />
              <textarea
                className="w-full p-2 text-xs border border-border rounded-md resize-none"
                rows={2}
                value={editPatientFormData.address}
                onChange={(e) =>
                  setEditPatientFormData({
                    ...editPatientFormData,
                    address: e.target.value,
                  })
                }
                placeholder="Address"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-9 text-xs uppercase"
                onClick={() => setShowEditPatientModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-9 text-xs uppercase"
                onClick={handleUpdatePatient}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Package Enrollment Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-xl border border-slate-900 max-w-sm w-full p-5 space-y-4">
            <h3 className="text-sm text-foreground uppercase tracking-widest font-bold">
              Enroll in Medical Package
            </h3>
            <div className="space-y-4">
              <select
                className="w-full p-2 h-9 text-xs border border-border rounded-md"
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
              >
                <option value="">Choose a package...</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - Rs. {pkg.totalPrice}
                  </option>
                ))}
              </select>
              <div className="space-y-1">
                <Label>Enrollment Date</Label>
                <Input
                  type="date"
                  value={packageStartDate}
                  onChange={(e) => setPackageStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Expiry Date (Optional)</Label>
                <Input
                  type="date"
                  value={packageEndDate}
                  onChange={(e) => setPackageEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-9 text-xs uppercase"
                onClick={() => setShowPackageModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-9 text-xs uppercase bg-sky-600 hover:bg-sky-700 text-white"
                onClick={submitPackageEnrollment}
              >
                Enroll Patient
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <Dialog
        open={!!selectedDoc}
        onOpenChange={(open) => !open && setSelectedDoc(null)}
      >
        <DialogContent className="max-w-4xl w-[90vw] p-0 overflow-hidden bg-black/95 border-none">
          <DialogHeader className="p-4 bg-background/10 backdrop-blur-md flex flex-row items-center justify-between border-b border-white/10 absolute top-0 left-0 right-0 z-10">
            <DialogTitle className="text-white text-sm font-bold truncate">
              {selectedDoc?.name}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={() => setSelectedDoc(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="pt-16 pb-4 px-4 flex items-center justify-center min-h-[60vh] max-h-[85vh] overflow-auto">
            {selectedDoc?.type.includes("image") ? (
              <img
                src={selectedDoc.url}
                alt={selectedDoc.name}
                className="max-w-full max-h-full object-contain shadow-2xl"
              />
            ) : selectedDoc?.type === "application/pdf" ? (
              <iframe
                src={selectedDoc.url}
                className="w-full h-[70vh] rounded-lg"
                title={selectedDoc.name}
              />
            ) : (
              <div className="text-center space-y-4 py-20">
                <FileIcon className="h-20 w-20 text-white/50 mx-auto" />
                <p className="text-white/70">
                  Preview not available for this file type.
                </p>
                <Button
                  variant="outline"
                  className="text-white border-white/20"
                  asChild
                >
                  <a href={selectedDoc?.url} download={selectedDoc?.name}>
                    Download to View
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
