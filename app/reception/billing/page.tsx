"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Receipt,
  Plus,
  CreditCard,
  User,
  FileText,
  History,
  ArrowLeft,
  Search,
} from "lucide-react";
import { PrintableInvoice } from "@/components/PrintableInvoice";
import { IInvoice } from "@/models/Invoice";
import { formatDate } from "@/lib/utils";

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [items, setItems] = useState<
    {
      description: string;
      amount: string;
      selected: boolean;
      visitID?: string;
    }[]
  >([{ description: "", amount: "", selected: true }]);
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [splitPayments, setSplitPayments] = useState<
    { mode: string; amount: string }[]
  >([{ mode: "Cash", amount: "" }]);
  const [summary, setSummary] = useState<{
    totalPaid: number;
    totalPending: number;
    recentInvoices?: any[];
  }>({ totalPaid: 0, totalPending: 0, recentInvoices: [] });
  const [generatedInvoice, setGeneratedInvoice] = useState<IInvoice | null>(
    null,
  );

  const apiUrl = "/api";

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get(`${apiUrl}/patients`);
        setPatients(res.data);
      } catch (error) {
        console.error("Failed to fetch patients");
      }
    };
    fetchPatients();
  }, [apiUrl]);

  useEffect(() => {
    if (!selectedPatientId) return;

    const fetchDues = async () => {
      try {
        const res = await axios.get(
          `${apiUrl}/billing?patientID=${selectedPatientId}&type=dues`,
        );
        if (res.data.length > 0) {
          setItems(
            res.data.map((item: any) => ({
              description: item.description,
              amount: item.amount,
              visitID: item.visitID,
              selected: true,
            })),
          );
        } else {
          setItems([{ description: "", amount: "", selected: true }]);
        }
      } catch (error) {
        console.error("Failed to fetch dues");
      }
    };
    fetchDues();

    const fetchSummary = async () => {
      try {
        const res = await axios.get(
          `${apiUrl}/billing?patientID=${selectedPatientId}`,
        );
        setSummary(res.data);
      } catch (error) {
        console.error("Failed to fetch summary");
      }
    };
    fetchSummary();
  }, [selectedPatientId, apiUrl]);

  const handleAddItem = () => {
    setItems([...items, { description: "", amount: "", selected: true }]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems: any = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleAddSplitPayment = () => {
    setSplitPayments([...splitPayments, { mode: "UPI", amount: "" }]);
  };

  const handleRemoveSplitPayment = (index: number) => {
    setSplitPayments(splitPayments.filter((_, i) => i !== index));
  };

  const handleSplitChange = (index: number, field: string, value: any) => {
    const next = [...splitPayments];
    next[index] = { ...next[index], [field]: value };
    setSplitPayments(next);
  };

  const calculateTotal = () => {
    return items
      .filter((item: any) => item.selected)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const total = calculateTotal();
      if (paymentMode === "Split") {
        const splitTotal = splitPayments.reduce(
          (sum, p) => sum + (Number(p.amount) || 0),
          0,
        );
        if (splitTotal !== total) {
          alert(
            `Split total (₹${splitTotal}) must equal bill total (₹${total})`,
          );
          setLoading(false);
          return;
        }
      }

      const selectedPatient: any = patients.find(
        (p: any) => p.patientID === selectedPatientId,
      );
      if (!selectedPatient) return alert("Select a patient");

      const res = await axios.post(`${apiUrl}/billing`, {
        patientID: selectedPatient.patientID,
        patientName: selectedPatient.name,
        items: items
          .filter((i: any) => i.selected)
          .map((i) => ({
            description: i.description,
            amount: Number(i.amount),
            visitID: i.visitID,
          })),
        paymentMode: paymentMode,
        totalAmount: total,
        paymentBreakdown:
          paymentMode === "Split"
            ? splitPayments.map((p) => ({
                mode: p.mode,
                amount: Number(p.amount),
              }))
            : undefined,
      });

      // Handle printing
      setGeneratedInvoice(res.data);
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (error) {
      alert("Billing Failed");
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "receptionist")) {
    return <div className="p-10">Access Denied</div>;
  }

  return (
    <AppLayout>
      <div className="no-print">
        <main className="min-h-[calc(100vh-64px)] p-4 md:p-8 flex flex-col">
          {!selectedPatientId ? (
            /* Step 1: Patient Selection View */
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2">
                <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-primary/20">
                  <Receipt className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-black text-foreground tracking-tight">
                  Billing & Invoicing
                </h1>
                <p className="text-muted-foreground text-sm font-medium">
                  Search and select a patient to start generating a new invoice.
                </p>
              </div>

              <div className="w-full relative group">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="patientSearch"
                    placeholder="Search by Name, ID, or Phone Number..."
                    className="pl-12 h-14 text-base bg-background border-border shadow-lg focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                    value={patientSearchTerm}
                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                    autoComplete="off"
                    autoFocus
                  />
                </div>

                {/* Search Results Overlay */}
                {patientSearchTerm.length >= 2 && (
                  <div className="absolute z-50 w-full mt-2 bg-background border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[320px] overflow-y-auto">
                      {patients
                        .filter(
                          (p: any) =>
                            p.name
                              .toLowerCase()
                              .includes(patientSearchTerm.toLowerCase()) ||
                            p.patientID
                              .toLowerCase()
                              .includes(patientSearchTerm.toLowerCase()) ||
                            (p.mobile && p.mobile.includes(patientSearchTerm)),
                        )
                        .map((p: any) => (
                          <div
                            key={p.id}
                            className="p-4 hover:bg-muted cursor-pointer transition-all border-b border-border/50 last:border-0 group flex items-center justify-between"
                            onClick={() => {
                              setSelectedPatientId(p.patientID);
                              setPatientSearchTerm("");
                            }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-black text-xs">
                                {p.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                  {p.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                                  ID: {p.patientID} • {p.mobile}
                                </p>
                              </div>
                            </div>
                            <div className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                              Select
                            </div>
                          </div>
                        ))}
                      {patients.filter(
                        (p: any) =>
                          p.name
                            .toLowerCase()
                            .includes(patientSearchTerm.toLowerCase()) ||
                          p.patientID
                            .toLowerCase()
                            .includes(patientSearchTerm.toLowerCase()),
                      ).length === 0 && (
                        <div className="p-8 text-center text-sm text-muted-foreground italic flex flex-col items-center">
                          <Search className="h-8 w-8 mb-2 opacity-10" />
                          No patients found for "{patientSearchTerm}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-8 border-t border-dashed border-border w-full flex justify-center">
                <div className="flex items-center gap-6 text-muted-foreground/40">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Select Patient
                    </span>
                  </div>
                  <div className="h-px w-8 bg-border" />
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-border" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Generate Bill
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Billing View */
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-full"
                    onClick={() => setSelectedPatientId("")}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight">
                      Invoice Details
                    </h1>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                      Step 2: Review and Generate Bill
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-foreground leading-none">
                      {
                        patients.find(
                          (p: any) => p.patientID === selectedPatientId,
                        )?.name
                      }
                    </p>
                    <p className="text-[9px] text-muted-foreground font-bold tracking-widest">
                      ID: {selectedPatientId}
                    </p>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-secondary/30 p-4 rounded-xl border border-border flex justify-between items-center group hover:bg-secondary/40 transition-colors">
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                          Total Amount Paid
                        </span>
                        <div className="text-xl font-bold text-foreground tabular-nums mt-1">
                          ₹{summary.totalPaid.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
                        <CreditCard className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="bg-red-500/[0.03] p-4 rounded-xl border border-red-500/10 flex justify-between items-center group hover:bg-red-500/[0.05] transition-colors">
                      <div>
                        <span className="text-[9px] text-red-500/60 uppercase font-black tracking-widest">
                          Current Pending Dues
                        </span>
                        <div className="text-xl font-bold text-red-600 tabular-nums mt-1">
                          ₹{summary.totalPending.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600">
                        <Receipt className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/50 py-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <CardTitle className="text-xs uppercase font-black tracking-widest">
                            Line Items
                          </CardTitle>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px] font-black uppercase tracking-widest border-2"
                          onClick={handleAddItem}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add New
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <form onSubmit={handleSubmit}>
                        <div className="p-4 space-y-3">
                          {items.map((item: any, index) => (
                            <div
                              key={index}
                              className="flex gap-3 items-center p-2 rounded-lg hover:bg-muted/30 transition-colors group"
                            >
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "selected",
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 rounded-md border-border text-primary focus:ring-primary h-5 w-5"
                              />
                              <div className="flex-1">
                                <Input
                                  placeholder="Description"
                                  className="h-10 text-xs border-transparent focus:border-border bg-transparent focus:bg-background transition-all"
                                  value={item.description}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                  required
                                />
                              </div>
                              <div className="w-32 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                  ₹
                                </span>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  className="h-10 pl-7 text-xs tabular-nums text-right font-bold border-transparent focus:border-border bg-transparent focus:bg-background transition-all"
                                  value={item.amount}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "amount",
                                      e.target.value,
                                    )
                                  }
                                  required
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="p-6 bg-muted/20 border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4 text-left">
                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase text-muted-foreground font-black tracking-widest">
                                Select Payment Method
                              </Label>
                              <Select
                                value={paymentMode}
                                onValueChange={setPaymentMode}
                              >
                                <SelectTrigger className="h-10 text-xs bg-background border-2">
                                  <SelectValue placeholder="Choose Mode" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Cash" className="text-xs">
                                    Cash
                                  </SelectItem>
                                  <SelectItem value="UPI" className="text-xs">
                                    UPI
                                  </SelectItem>
                                  <SelectItem value="Card" className="text-xs">
                                    Card
                                  </SelectItem>
                                  <SelectItem
                                    value="Split"
                                    className="text-xs font-bold text-primary"
                                  >
                                    Split (Multiple)
                                  </SelectItem>
                                  <SelectItem
                                    value="Insurance"
                                    className="text-xs"
                                  >
                                    Insurance
                                  </SelectItem>
                                  <SelectItem value="Other" className="text-xs">
                                    Other
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {paymentMode === "Split" && (
                              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                {splitPayments.map((p, idx) => (
                                  <div
                                    key={idx}
                                    className="flex gap-2 items-center bg-background p-2 rounded-lg border shadow-sm"
                                  >
                                    <Select
                                      value={p.mode}
                                      onValueChange={(val) =>
                                        handleSplitChange(idx, "mode", val)
                                      }
                                    >
                                      <SelectTrigger className="h-8 text-[10px] w-24 border-0 focus:ring-0">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Cash">
                                          Cash
                                        </SelectItem>
                                        <SelectItem value="UPI">UPI</SelectItem>
                                        <SelectItem value="Card">
                                          Card
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <div className="flex-1 relative">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground underline">
                                        ₹
                                      </span>
                                      <Input
                                        type="number"
                                        className="h-8 border-0 focus:ring-0 text-[11px] tabular-nums font-bold text-right pl-5"
                                        value={p.amount}
                                        onChange={(e) =>
                                          handleSplitChange(
                                            idx,
                                            "amount",
                                            e.target.value,
                                          )
                                        }
                                        required
                                      />
                                    </div>
                                    {idx > 0 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                                        onClick={() =>
                                          handleRemoveSplitPayment(idx)
                                        }
                                      >
                                        ✕
                                      </Button>
                                    )}
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="w-full h-8 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 border border-dashed border-primary/20"
                                  onClick={handleAddSplitPayment}
                                >
                                  + Add Another Mode
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col justify-between">
                            <div className="text-right space-y-1">
                              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                                Net Total Payable
                              </span>
                              <div className="text-4xl font-black text-foreground tabular-nums tracking-tighter">
                                ₹{calculateTotal().toLocaleString("en-IN")}
                              </div>
                              {paymentMode === "Split" && (
                                <div className="text-[10px] font-bold text-primary flex justify-end items-center gap-1">
                                  <span>Split Valid:</span>
                                  <span>
                                    ₹
                                    {splitPayments
                                      .reduce(
                                        (s, p) => s + (Number(p.amount) || 0),
                                        0,
                                      )
                                      .toLocaleString("en-IN")}
                                  </span>
                                </div>
                              )}
                            </div>
                            <Button
                              type="submit"
                              className="w-full h-12 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 mt-6"
                              disabled={loading || calculateTotal() === 0}
                            >
                              {loading
                                ? "Processing..."
                                : "Finish & Print Invoice"}
                            </Button>
                          </div>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="border-border/50 shadow-sm h-full overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/50 py-4">
                      <CardTitle className="text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                        Billing History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {summary.recentInvoices &&
                      summary.recentInvoices.length > 0 ? (
                        <div className="divide-y max-h-[600px] overflow-y-auto">
                          {summary.recentInvoices.map(
                            (inv: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-4 hover:bg-muted/50 transition-colors group"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-black text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded tracking-widest border border-primary/10">
                                    {inv.invoiceNumber}
                                  </span>
                                  <span className="text-[10px] font-medium text-muted-foreground">
                                    {formatDate(inv.createdAt)}
                                  </span>
                                </div>
                                <div className="text-xs text-foreground font-medium mb-2 leading-tight group-hover:text-primary transition-colors">
                                  {inv.items
                                    .map((i: any) => i.description)
                                    .join(", ")}
                                </div>
                                <div className="flex justify-between items-center bg-secondary/20 p-2 rounded-lg">
                                  <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                                    {inv.paymentMode}
                                  </span>
                                  <span className="text-xs font-black text-foreground tabular-nums">
                                    ₹{inv.totalAmount.toLocaleString("en-IN")}
                                  </span>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <div className="p-12 text-center text-muted-foreground text-sm flex flex-col items-center">
                          <History className="h-12 w-12 mb-3 opacity-10" />
                          <p className="font-bold uppercase text-[10px] tracking-widest">
                            No Billing History
                          </p>
                          <p className="text-[11px] mt-1 font-medium">
                            New patient record
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <PrintableInvoice invoice={generatedInvoice} />
    </AppLayout>
  );
}
