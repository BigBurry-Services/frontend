"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  ChevronRight,
  Download,
  Upload,
  Printer,
  X,
  Filter,
  ArrowLeft,
  Users,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function PatientsListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All"); // All, <18, 18-60, 60+
  const [dateFilter, setDateFilter] = useState("All"); // All, Today, This Week, This Month

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/patients");
      setPatients(res.data);
    } catch (error) {
      console.error("Failed to fetch patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const exportToCSV = () => {
    const headers = [
      "Patient ID",
      "Name",
      "Age",
      "Gender",
      "Mobile",
      "Address",
      "Joined Date",
    ];
    const csvData = patients.map((p) =>
      [
        p.patientID,
        `"${p.name}"`,
        p.age,
        p.gender,
        p.mobile,
        `"${p.address || ""}"`,
        formatDate(p.createdAt),
      ].join(","),
    );

    const csvString = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Patients_List_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("Are you sure you want to import patients from this CSV?"))
      return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      // Skip header
      const dataLines = lines.slice(1).filter((line) => line.trim() !== "");

      let errorCount = 0;

      for (const line of dataLines) {
        // Simple splitting (assuming no commas in quoted fields for basic version)
        const parts = line.split(",").map((f) => f.replace(/"/g, "").trim());
        if (parts.length < 5) continue;

        const [, name, age, gender, mobile, address] = parts;

        try {
          await axios.post("/api/patients", {
            name,
            age: Number(age),
            gender,
            mobile,
            address,
          });
        } catch (err) {
          errorCount++;
        }
      }

      alert(`Import completed! Errors: ${errorCount}. Refreshing list...`);
      fetchPatients();
    };
    reader.readAsText(file);
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mobile.includes(searchTerm);

    const matchesGender = genderFilter === "All" || p.gender === genderFilter;

    let matchesAge = true;
    if (ageFilter === "<18") matchesAge = p.age < 18;
    else if (ageFilter === "18-60") matchesAge = p.age >= 18 && p.age <= 60;
    else if (ageFilter === "60+") matchesAge = p.age > 60;

    let matchesDate = true;
    const joinedDate = new Date(p.createdAt);
    const now = new Date();
    if (dateFilter === "Today") {
      matchesDate = joinedDate.toDateString() === now.toDateString();
    } else if (dateFilter === "This Week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = joinedDate >= weekAgo;
    } else if (dateFilter === "This Month") {
      matchesDate =
        joinedDate.getMonth() === now.getMonth() &&
        joinedDate.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesGender && matchesAge && matchesDate;
  });

  if (!user || (user.role !== "admin" && user.role !== "receptionist")) {
    return <div className="p-10">Access Denied</div>;
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        <header className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/reception")}
                className="rounded-full h-10 w-10 p-0"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  System Patient Records
                </h1>
                <p className="text-muted-foreground text-xs md:text-sm font-medium uppercase tracking-widest">
                  Manage and export your hospital database
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="h-9 md:h-11 flex-1 md:flex-none text-xs md:text-sm border-2 font-bold px-3 md:px-5 bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100"
            >
              <Upload className="w-3 h-3 md:w-4 md:h-4 mr-2" /> Import
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleImportCSV}
            />
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="h-9 md:h-11 flex-1 md:flex-none text-xs md:text-sm border-2 font-bold px-3 md:px-5 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            >
              <Download className="w-3 h-3 md:w-4 md:h-4 mr-2" /> Export
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="h-9 md:h-11 flex-1 md:flex-none text-xs md:text-sm border-2 font-bold px-3 md:px-5 border-slate-200 hover:bg-slate-50"
            >
              <Printer className="w-3 h-3 md:w-4 md:h-4 mr-2" /> Print
            </Button>
          </div>
        </header>

        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/10 border-b py-0 h-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 md:p-6">
              <div className="relative col-span-2 md:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-10 md:h-11 bg-background"
                  placeholder="ID, Name or Mobile"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full">
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="h-10 md:h-11">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Genders</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full">
                <Select value={ageFilter} onValueChange={setAgeFilter}>
                  <SelectTrigger className="h-10 md:h-11">
                    <SelectValue placeholder="Age Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Ages</SelectItem>
                    <SelectItem value="<18">Children (&lt;18)</SelectItem>
                    <SelectItem value="18-60">Adults (18-60)</SelectItem>
                    <SelectItem value="60+">Seniors (60+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full relative col-span-2 md:col-span-1">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="h-10 md:h-11">
                    <SelectValue placeholder="Joined" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Time</SelectItem>
                    <SelectItem value="Today">Joined Today</SelectItem>
                    <SelectItem value="This Week">Joined This Week</SelectItem>
                    <SelectItem value="This Month">
                      Joined This Month
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-20 text-center text-muted-foreground animate-pulse font-bold uppercase tracking-widest">
                Loading Records...
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest">
                          ID
                        </TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest">
                          Patient Name
                        </TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">
                          Age
                        </TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">
                          Gender
                        </TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest">
                          Mobile
                        </TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest">
                          Address
                        </TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest">
                          Joined
                        </TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((p) => (
                          <TableRow
                            key={p.id}
                            className="hover:bg-muted/30 transition-colors group"
                          >
                            <TableCell className="font-bold text-sky-700 text-xs tabular-nums">
                              {p.patientID}
                            </TableCell>
                            <TableCell className="font-bold text-sm">
                              {p.name}
                            </TableCell>
                            <TableCell className="text-center font-medium text-xs">
                              {p.age}
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${p.gender === "Male" ? "bg-blue-100 text-blue-700" : p.gender === "Female" ? "bg-pink-100 text-pink-700" : "bg-slate-100 text-slate-700"}`}
                              >
                                {p.gender}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs font-medium tabular-nums text-muted-foreground">
                              {p.mobile}
                            </TableCell>
                            <TableCell className="text-[11px] text-muted-foreground max-w-[200px] truncate">
                              {p.address || "N/A"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDate(p.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                onClick={() =>
                                  router.push(
                                    `/reception/patient/${p.patientID}`,
                                  )
                                }
                                variant="ghost"
                                size="sm"
                                className="h-8 text-[10px] font-black uppercase tracking-widest text-primary border border-transparent hover:border-primary/20"
                              >
                                Profile{" "}
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="h-64 text-center">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <Users className="h-12 w-12 mb-4 opacity-10" />
                              <p className="font-bold uppercase text-[10px] tracking-widest">
                                No matching records found
                              </p>
                              <p className="text-[11px] mt-1">
                                Try adjusting your filters or search term
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-border">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 flex flex-col gap-3 hover:bg-muted/30 transition-colors"
                        onClick={() =>
                          router.push(`/reception/patient/${p.patientID}`)
                        }
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-black text-xs">
                              {p.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-foreground">
                                {p.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                                {p.patientID} • {p.age} Yrs
                              </p>
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${p.gender === "Male" ? "bg-blue-100 text-blue-700" : p.gender === "Female" ? "bg-pink-100 text-pink-700" : "bg-slate-100 text-slate-700"}`}
                          >
                            {p.gender}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-muted/20 p-2 rounded">
                            <span className="block text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">
                              Mobile
                            </span>
                            <span className="font-medium">{p.mobile}</span>
                          </div>
                          <div className="bg-muted/20 p-2 rounded">
                            <span className="block text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">
                              Joined
                            </span>
                            <span className="font-medium">
                              {formatDate(p.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center">
                            View Profile{" "}
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                      <Users className="h-10 w-10 mb-3 opacity-10" />
                      <p className="font-bold uppercase text-[10px] tracking-widest">
                        No records found
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
