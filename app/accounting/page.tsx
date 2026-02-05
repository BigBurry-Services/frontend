"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import axios from "axios";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppLayout } from "@/components/AppLayout";
import { formatDate } from "@/lib/utils";
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
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
  Download,
  FileText,
  CreditCard,
  Plus,
  AlertCircle,
} from "lucide-react";

export default function AccountingDashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>({
    sales: [],
    expenses: [],
    summary: { totalSales: 0, totalExpenses: 0, netBalance: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [scope, setScope] = useState("all");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    category: "General",
    paymentMode: "Cash",
  });
  const [splitPayments, setSplitPayments] = useState<
    { mode: string; amount: string }[]
  >([{ mode: "Cash", amount: "" }]);
  const [saleSplitPayments, setSaleSplitPayments] = useState<
    { mode: string; amount: string }[]
  >([{ mode: "Cash", amount: "" }]);
  const [saleForm, setSaleForm] = useState({
    customerName: "Walk-in",
    description: "",
    amount: "",
    paymentMode: "Cash",
  });

  const exportToCSV = (type: "sales" | "expenses") => {
    const records = type === "sales" ? data.sales : data.expenses;
    if (!records.length) return alert("No data to export");

    let csvContent = "";
    if (type === "sales") {
      csvContent = "Date,Invoice #,Customer,Amount,Payment Mode\n";
      records.forEach((s: any) => {
        let paymentInfo = s.paymentMode || "Cash";
        if (s.paymentMode === "Split" && s.paymentBreakdown) {
          paymentInfo = `Split (${s.paymentBreakdown
            .map((p: any) => `${p.mode}: ${p.amount}`)
            .join(", ")})`;
        }
        csvContent += `${new Date(s.createdAt).toISOString().split("T")[0]},${s.invoiceNumber},${s.patientName},${s.totalAmount},"${paymentInfo}"\n`;
      });
    } else {
      csvContent = "Date,Description,Category,Payment Mode,Amount\n";
      records.forEach((e: any) => {
        let paymentInfo = e.paymentMode || "Cash";
        if (e.paymentMode === "Split" && e.paymentBreakdown) {
          paymentInfo = `Split (${e.paymentBreakdown
            .map((p: any) => `${p.mode}: ${p.amount}`)
            .join(", ")})`;
        }
        csvContent += `${e.date},${e.description},${e.category},"${paymentInfo}",${e.amount}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${type}_report_${scope}_${selectedDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    window.print();
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const url =
        scope === "daily"
          ? `/api/accounting?scope=daily&date=${selectedDate}`
          : `/api/accounting?scope=all`;
      const res = await axios.get(url);
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch accounting data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, scope]);

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

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = Number(expenseForm.amount);
      if (expenseForm.paymentMode === "Split") {
        const splitTotal = splitPayments.reduce(
          (sum, p) => sum + (Number(p.amount) || 0),
          0,
        );
        if (splitTotal !== amount) {
          alert(
            `Split total (${splitTotal}) must equal expense amount (${amount})`,
          );
          return;
        }
      }

      await axios.post("/api/accounting", {
        ...expenseForm,
        amount: amount,
        date: new Date().toISOString().split("T")[0],
        paymentBreakdown:
          expenseForm.paymentMode === "Split"
            ? splitPayments.map((p) => ({
                mode: p.mode,
                amount: Number(p.amount),
              }))
            : undefined,
      });
      setExpenseForm({
        description: "",
        amount: "",
        category: "General",
        paymentMode: "Cash",
      });
      setSplitPayments([{ mode: "Cash", amount: "" }]);
      fetchData();
    } catch (error) {
      alert("Failed to add expense");
    }
  };

  const handleAddSaleSplitPayment = () => {
    setSaleSplitPayments([...saleSplitPayments, { mode: "UPI", amount: "" }]);
  };

  const handleRemoveSaleSplitPayment = (index: number) => {
    setSaleSplitPayments(saleSplitPayments.filter((_, i) => i !== index));
  };

  const handleSaleSplitChange = (index: number, field: string, value: any) => {
    const next = [...saleSplitPayments];
    next[index] = { ...next[index], [field]: value };
    setSaleSplitPayments(next);
  };

  const handleRegisterSale = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = Number(saleForm.amount);
      if (saleForm.paymentMode === "Split") {
        const splitTotal = saleSplitPayments.reduce(
          (sum, p) => sum + (Number(p.amount) || 0),
          0,
        );
        if (splitTotal !== amount) {
          alert(
            `Split total (${splitTotal}) must equal sale amount (${amount})`,
          );
          return;
        }
      }

      await axios.post("/api/billing", {
        patientID: "OTC", // Over the counter
        patientName: saleForm.customerName,
        paymentMode: saleForm.paymentMode,
        items: [
          {
            description: saleForm.description,
            amount: amount,
          },
        ],
        totalAmount: amount,
        paymentBreakdown:
          saleForm.paymentMode === "Split"
            ? saleSplitPayments.map((p) => ({
                mode: p.mode,
                amount: Number(p.amount),
              }))
            : undefined,
      });
      setSaleForm({
        customerName: "Walk-in",
        description: "",
        amount: "",
        paymentMode: "Cash",
      });
      setSaleSplitPayments([{ mode: "Cash", amount: "" }]);
      fetchData();
    } catch (error) {
      alert("Failed to register sale");
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full space-y-6 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Financial Overview
            </h1>
            <p className="text-muted-foreground">
              Track sales, expenses, and net performance.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            {["overview", "expenses", "sales"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-xl border shadow-sm no-print">
          <Select value={scope} onValueChange={(val) => setScope(val)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>

          {scope === "daily" && (
            <Input
              type="date"
              className="w-auto"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          )}
          {scope === "monthly" && (
            <Input
              type="month"
              className="w-auto"
              value={selectedDate.substring(0, 7)}
              onChange={(e) => setSelectedDate(`${e.target.value}-01`)}
            />
          )}
          {scope === "yearly" && (
            <Select
              value={selectedDate.substring(0, 4)}
              onValueChange={(val) => setSelectedDate(`${val}-01-01`)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 5 + i;
                  return (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Sales
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ₹{data.summary.totalSales.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scope === "daily" ? "For selected date" : "Total revenue"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Expenses
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    ₹{data.summary.totalExpenses.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scope === "daily" ? "For selected date" : "Total costs"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Net Balance
                  </CardTitle>
                  <Wallet className="h-4 w-4 text-sky-500" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      data.summary.netBalance >= 0
                        ? "text-sky-600"
                        : "text-orange-600"
                    }`}
                  >
                    ₹{data.summary.netBalance.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sales - Expenses
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-sky-50/50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-800">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="p-4 bg-background rounded-full shadow-sm">
                  <DollarSign className="h-8 w-8 text-sky-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Financial Performance</h2>
                  <p className="text-muted-foreground max-w-md mx-auto mt-2">
                    Current net performance is{" "}
                    <span
                      className={
                        data.summary.netBalance >= 0
                          ? "text-green-600 font-bold"
                          : "text-red-600 font-bold"
                      }
                    >
                      ₹{data.summary.netBalance.toLocaleString()}
                    </span>
                    .{" "}
                    {scope === "all"
                      ? "Showing all-time results."
                      : "Based on selected period."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "expenses" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            <div className="lg:col-span-1 no-print">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Add Daily Expense</CardTitle>
                  <CardDescription>Record a new expense item</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder=""
                        value={expenseForm.description}
                        onChange={(e) =>
                          setExpenseForm({
                            ...expenseForm,
                            description: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder=""
                        value={expenseForm.amount}
                        onChange={(e) =>
                          setExpenseForm({
                            ...expenseForm,
                            amount: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={expenseForm.category}
                        onValueChange={(val) =>
                          setExpenseForm({ ...expenseForm, category: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Utilities">Utilities</SelectItem>
                          <SelectItem value="Salary">Salary</SelectItem>
                          <SelectItem value="Rent">Rent</SelectItem>
                          <SelectItem value="Kitchen">Kitchen</SelectItem>
                          <SelectItem value="Clinic">Clinic</SelectItem>
                          <SelectItem value="Medicine">Medicine</SelectItem>
                          <SelectItem value="Staff Welfare">
                            Staff Welfare
                          </SelectItem>
                          <SelectItem value="Medical Supplies">
                            Medical Supplies
                          </SelectItem>
                          <SelectItem value="Maintenance">
                            Maintenance
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Mode</Label>
                      <Select
                        value={expenseForm.paymentMode}
                        onValueChange={(val) =>
                          setExpenseForm({ ...expenseForm, paymentMode: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="Card">Card</SelectItem>
                          <SelectItem value="Bank Transfer">
                            Bank Transfer
                          </SelectItem>
                          <SelectItem value="Split">Split</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {expenseForm.paymentMode === "Split" && (
                      <div className="space-y-3 p-3 bg-muted rounded-md">
                        <Label>Split Breakdown</Label>
                        {splitPayments.map((p, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <Select
                              value={p.mode}
                              onValueChange={(val) =>
                                handleSplitChange(idx, "mode", val)
                              }
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="Card">Card</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              placeholder="Amount"
                              className="flex-1"
                              value={p.amount}
                              onChange={(e) =>
                                handleSplitChange(idx, "amount", e.target.value)
                              }
                            />
                            {idx > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSplitPayment(idx)}
                              >
                                ✕
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={handleAddSplitPayment}
                        >
                          + Add Split
                        </Button>
                        <div className="text-xs text-right text-muted-foreground">
                          Total:{" "}
                          {splitPayments.reduce(
                            (acc, curr) => acc + (Number(curr.amount) || 0),
                            0,
                          )}{" "}
                          / {expenseForm.amount}
                        </div>
                      </div>
                    )}
                    <Button type="submit" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Save Expense
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 md:pb-2">
                  <div>
                    <CardTitle>Expense Ledger</CardTitle>
                    <CardDescription>
                      Total: ₹{data.summary.totalExpenses.toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 no-print">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV("expenses")}
                    >
                      <Download className="h-4 w-4 mr-2" /> CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToPDF}>
                      <FileText className="h-4 w-4 mr-2" /> PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Payment Mode</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.expenses.map((exp: any) => (
                        <TableRow key={exp.id}>
                          <TableCell className="font-mono text-xs">
                            {formatDate(exp.date)}
                          </TableCell>
                          <TableCell>{exp.description}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full bg-muted text-[10px] uppercase font-bold">
                              {exp.category}
                            </span>
                          </TableCell>
                          <TableCell>
                            {exp.paymentMode === "Split" &&
                            exp.paymentBreakdown ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-xs">
                                  Split
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {exp.paymentBreakdown
                                    .map((p: any) => `${p.mode}: ${p.amount}`)
                                    .join(", ")}
                                </span>
                              </div>
                            ) : (
                              exp.paymentMode || "Cash"
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            ₹{exp.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {data.expenses.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No expenses found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "sales" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            <div className="lg:col-span-1 no-print">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Register Manual Sale</CardTitle>
                  <CardDescription>For walk-in or OTC sales</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegisterSale} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Customer Name</Label>
                      <Input
                        id="customerName"
                        placeholder=""
                        value={saleForm.customerName}
                        onChange={(e) =>
                          setSaleForm({
                            ...saleForm,
                            customerName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="saleDescription">Description</Label>
                      <Input
                        id="saleDescription"
                        placeholder=""
                        value={saleForm.description}
                        onChange={(e) =>
                          setSaleForm({
                            ...saleForm,
                            description: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="saleAmount">Amount</Label>
                      <Input
                        id="saleAmount"
                        type="number"
                        placeholder=""
                        value={saleForm.amount}
                        onChange={(e) =>
                          setSaleForm({ ...saleForm, amount: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Mode</Label>
                      <Select
                        value={saleForm.paymentMode}
                        onValueChange={(val) =>
                          setSaleForm({ ...saleForm, paymentMode: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="Card">Card</SelectItem>
                          <SelectItem value="Bank Transfer">
                            Bank Transfer
                          </SelectItem>
                          <SelectItem value="Split">Split</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {saleForm.paymentMode === "Split" && (
                      <div className="space-y-3 p-3 bg-muted rounded-md">
                        <Label>Split Breakdown</Label>
                        {saleSplitPayments.map((p, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <Select
                              value={p.mode}
                              onValueChange={(val) =>
                                handleSaleSplitChange(idx, "mode", val)
                              }
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="Card">Card</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              placeholder="Amount"
                              className="flex-1"
                              value={p.amount}
                              onChange={(e) =>
                                handleSaleSplitChange(
                                  idx,
                                  "amount",
                                  e.target.value,
                                )
                              }
                            />
                            {idx > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveSaleSplitPayment(idx)
                                }
                              >
                                ✕
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={handleAddSaleSplitPayment}
                        >
                          + Add Split
                        </Button>
                        <div className="text-xs text-right text-muted-foreground">
                          Total:{" "}
                          {saleSplitPayments.reduce(
                            (acc, curr) => acc + (Number(curr.amount) || 0),
                            0,
                          )}{" "}
                          / {saleForm.amount}
                        </div>
                      </div>
                    )}

                    <Button type="submit" className="w-full">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Register Sale
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 md:pb-2">
                  <div>
                    <CardTitle>Sales History</CardTitle>
                    <CardDescription>
                      Total: ₹{data.summary.totalSales.toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 no-print">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV("sales")}
                    >
                      <Download className="h-4 w-4 mr-2" /> CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToPDF}>
                      <FileText className="h-4 w-4 mr-2" /> PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.sales.map((sale: any) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-mono text-xs">
                            {formatDate(sale.createdAt)}
                          </TableCell>
                          <TableCell className="font-mono text-sky-600">
                            {sale.invoiceNumber}
                          </TableCell>
                          <TableCell>{sale.patientName}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            ₹{sale.totalAmount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {data.sales.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No sales records found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
