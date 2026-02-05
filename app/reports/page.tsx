"use client";

import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import {
  FileBarChart,
  Wallet,
  Users,
  Pill,
  CalendarCheck,
  History,
  Download,
} from "lucide-react";
import { useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  if (!user || !["admin", "receptionist"].includes(user.role)) {
    return <div className="p-10">Access Denied</div>;
  }

  const handleExport = () => {
    if (!reportData || reportData.length === 0) return;

    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `${selectedReport}_report_${new Date().toISOString().split("T")[0]}.csv`;

    if (selectedReport === "visits") {
      headers = [
        "Date",
        "Time",
        "Token",
        "Patient Name",
        "Patient ID",
        "Doctor(s)",
        "Status",
      ];
      rows = reportData.map((v: any) => [
        new Date(v.createdAt).toLocaleDateString(),
        new Date(v.createdAt).toLocaleTimeString(),
        v.token,
        v.patientName,
        v.patientID,
        v.doctorNames || "Unassigned",
        v.status,
      ]);
    } else if (selectedReport === "logins") {
      headers = ["Timestamp", "User", "Action"];
      rows = reportData.map((l: any) => [
        new Date(l.timestamp).toLocaleString(),
        l.username,
        l.action,
      ]);
    } else if (selectedReport === "financial") {
      headers = ["Date", "Description", "Type", "Amount"];
      rows = reportData.map((f: any) => [
        new Date(f.date).toLocaleDateString(),
        f.description,
        f.type,
        f.amount.toString(),
      ]);
    } else if (selectedReport === "stock") {
      headers = ["Timestamp", "Item Name", "Type", "Quantity", "Reason"];
      rows = reportData.map((s: any) => [
        new Date(s.timestamp).toLocaleString(),
        s.itemName,
        s.type,
        s.change.toString(),
        s.reason,
      ]);
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((e) =>
        e.map((i) => `"${String(i).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchReport = async (reportId: string) => {
    setLoading(true);
    setReportData([]);
    setSelectedReport(reportId);
    try {
      let endpoint = "";
      if (reportId === "visits") endpoint = "/api/reports/visits";
      if (reportId === "logins") endpoint = "/api/reports/logins";
      if (reportId === "financial") endpoint = "/api/reports/financial";
      if (reportId === "stock") endpoint = "/api/reports/stock";

      if (endpoint) {
        const res = await axios.get(endpoint);
        setReportData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const reports = [
    {
      id: "visits",
      title: "All Visits",
      description: "Detailed log of all patient visits and doctors.",
      icon: CalendarCheck,
      color: "text-blue-600 bg-blue-50",
    },
    {
      id: "logins",
      title: "User Login History",
      description: "Audit log of system access (Login/Logout times).",
      icon: History,
      color: "text-purple-600 bg-purple-50",
    },
    {
      id: "financial",
      title: "Financial Reports",
      description: "Revenue (Sales) vs Expenses timeline.",
      icon: Wallet,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      id: "stock",
      title: "Stock Movement",
      description: "History of Stock In (Additions) and Out (Sales).",
      icon: Pill,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <AppLayout>
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Reports</h1>
          <p className="text-muted-foreground">
            View and generate key metrics for the hospital.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reports.map((report) => (
            <Card
              key={report.id}
              className={`cursor-pointer transition-all hover:shadow-md border-2 ${selectedReport === report.id ? "border-primary" : "border-transparent"}`}
              onClick={() => fetchReport(report.id)}
            >
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <div className={`p-2 rounded-lg ${report.color}`}>
                  <report.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base">{report.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">
                  {report.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedReport && (
          <Card className="min-h-[400px]">
            <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
              <CardTitle>
                {reports.find((r) => r.id === selectedReport)?.title}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={loading || reportData.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center p-12">Loading data...</div>
              ) : (
                <>
                  {selectedReport === "visits" && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Token</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Doctor(s)</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.map((visit: any) => (
                          <TableRow key={visit.id}>
                            <TableCell className="font-medium">
                              {formatDate(visit.createdAt)}
                              <div className="text-xs text-muted-foreground">
                                {new Date(visit.createdAt).toLocaleTimeString()}
                              </div>
                            </TableCell>
                            <TableCell>#{visit.token}</TableCell>
                            <TableCell>
                              {visit.patientName}
                              <div className="text-xs text-muted-foreground">
                                {visit.patientID}
                              </div>
                            </TableCell>
                            <TableCell>
                              {visit.doctorNames || "Unassigned"}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                                  visit.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : visit.status === "cancelled"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {visit.status.replace("_", " ")}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {reportData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              No visits found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}

                  {selectedReport === "logins" && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono">
                              {new Date(log.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold">
                                {log.username}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-md text-xs font-bold ${
                                  log.action === "LOGIN"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {log.action}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {reportData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8">
                              No login history found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}

                  {selectedReport === "financial" && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono">
                              {formatDate(item.date)}
                            </TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-md text-xs font-bold ${
                                  item.type === "INCOME"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {item.type}
                              </span>
                            </TableCell>
                            <TableCell
                              className={`text-right font-medium ${item.type === "INCOME" ? "text-emerald-700" : "text-red-700"}`}
                            >
                              {item.type === "INCOME" ? "+" : "-"}₹{item.amount}
                            </TableCell>
                          </TableRow>
                        ))}
                        {reportData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              No financial records found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}

                  {selectedReport === "stock" && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono">
                              {new Date(log.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {log.itemName}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-md text-xs font-bold ${
                                  log.type === "IN"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {log.type}
                              </span>
                            </TableCell>
                            <TableCell>{log.change}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {log.reason}
                            </TableCell>
                          </TableRow>
                        ))}
                        {reportData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              No stock movement history found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}

                  {/* Placeholder for others */}
                  {!["visits", "logins", "financial", "stock"].includes(
                    selectedReport,
                  ) && (
                    <div className="text-center py-12 text-muted-foreground">
                      Report generation for this category is coming soon.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </AppLayout>
  );
}
