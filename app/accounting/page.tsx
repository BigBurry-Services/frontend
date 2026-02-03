"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEffect, useState } from "react";
import axios from "axios";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppLayout } from "@/components/AppLayout";

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
  });
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
        csvContent += `${new Date(s.createdAt).toISOString().split("T")[0]},${s.invoiceNumber},${s.patientName},${s.totalAmount},${s.paymentMode}\n`;
      });
    } else {
      csvContent = "Date,Description,Category,Amount\n";
      records.forEach((e: any) => {
        csvContent += `${e.date},${e.description},${e.category},${e.amount}\n`;
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

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/accounting", {
        ...expenseForm,
        amount: Number(expenseForm.amount),
        date: new Date().toISOString().split("T")[0],
      });
      setExpenseForm({ description: "", amount: "", category: "General" });
      fetchData();
    } catch (error) {
      alert("Failed to add expense");
    }
  };

  const handleRegisterSale = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/billing", {
        patientID: "OTC", // Over the counter
        patientName: saleForm.customerName,
        paymentMode: saleForm.paymentMode,
        items: [
          {
            description: saleForm.description,
            amount: Number(saleForm.amount),
          },
        ],
      });
      setSaleForm({
        customerName: "Walk-in",
        description: "",
        amount: "",
        paymentMode: "Cash",
      });
      fetchData();
    } catch (error) {
      alert("Failed to register sale");
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground font-semibold">
          Access Denied. Admin only.
        </p>
      </div>
    );
  }

  return (
    <AppLayout>
      <nav className="bg-card border-b border-border px-6 py-4 flex justify-between items-center sticky top-0 z-10 no-print">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {activeTab === "overview"
              ? "Financial Overview"
              : activeTab === "expenses"
                ? "Expense Ledger"
                : "Sales History"}
          </h1>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex bg-muted p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "overview" ? "bg-white dark:bg-slate-800 shadow-sm text-sky-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("expenses")}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "expenses" ? "bg-white dark:bg-slate-800 shadow-sm text-sky-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              Expenses
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "sales" ? "bg-white dark:bg-slate-800 shadow-sm text-sky-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              Sales History
            </button>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          {/* ... scope selector ... */}
          <div className="flex bg-muted rounded-lg p-1 mr-2">
            <button
              onClick={() => setScope("all")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${scope === "all" ? "bg-white dark:bg-slate-800 shadow-sm" : "text-slate-500"}`}
            >
              All Time
            </button>
            <button
              onClick={() => setScope("daily")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${scope === "daily" ? "bg-white dark:bg-slate-800 shadow-sm" : "text-slate-500"}`}
            >
              Daily
            </button>
            <button
              onClick={() => setScope("monthly")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${scope === "monthly" ? "bg-white dark:bg-slate-800 shadow-sm" : "text-slate-500"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setScope("yearly")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${scope === "yearly" ? "bg-white dark:bg-slate-800 shadow-sm" : "text-slate-500"}`}
            >
              Yearly
            </button>
          </div>
          {scope === "daily" && (
            <Input
              type="date"
              className="w-40 h-9"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          )}
          {scope === "monthly" && (
            <Input
              type="month"
              className="w-40 h-9"
              value={selectedDate.substring(0, 7)}
              onChange={(e) => setSelectedDate(`${e.target.value}-01`)}
            />
          )}
          {scope === "yearly" && (
            <select
              className="w-32 h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20"
              value={selectedDate.substring(0, 4)}
              onChange={(e) => setSelectedDate(`${e.target.value}-01-01`)}
            >
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - 5 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          )}
          <ThemeToggle />
        </div>
      </nav>

      <main className="p-6 space-y-6">
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {scope === "daily" ? "Daily Sales" : "Total Sales"}
                </h3>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  ₹{data.summary.totalSales.toLocaleString()}
                </p>
              </div>
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {scope === "daily" ? "Daily Expenses" : "Total Expenses"}
                </h3>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  ₹{data.summary.totalExpenses.toLocaleString()}
                </p>
              </div>
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Net Balance
                </h3>
                <p
                  className={`text-3xl font-bold mt-1 ${data.summary.netBalance >= 0 ? "text-sky-600" : "text-orange-600"}`}
                >
                  ₹{data.summary.netBalance.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-sky-50 dark:bg-sky-950/30 rounded-full flex items-center justify-center text-sky-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Financial Performance</h2>
                <p className="text-muted-foreground max-w-md mx-auto mt-2">
                  The current net performance is{" "}
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
                    : scope === "monthly"
                      ? `Showing results for ${new Date(selectedDate).toLocaleString("default", { month: "long", year: "numeric" })}.`
                      : scope === "yearly"
                        ? `Showing results for ${new Date(selectedDate).getFullYear()}.`
                        : `Showing results for ${selectedDate}.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "expenses" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {/* Add Expense Form */}
            <div className="lg:col-span-1 no-print">
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm sticky top-24">
                <h2 className="text-lg font-bold mb-4">Add Daily Expense</h2>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <Input
                    label="Description"
                    placeholder="e.g. Electricity, Maintenance..."
                    value={expenseForm.description}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        description: e.target.value,
                      })
                    }
                    required
                  />
                  <Input
                    label="Amount"
                    type="number"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        amount: e.target.value,
                      })
                    }
                    required
                  />
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Category
                    </label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20"
                      value={expenseForm.category}
                      onChange={(e) =>
                        setExpenseForm({
                          ...expenseForm,
                          category: e.target.value,
                        })
                      }
                    >
                      <option>General</option>
                      <option>Utilities</option>
                      <option>Staff Welfare</option>
                      <option>Medical Supplies</option>
                      <option>Maintenance</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full">
                    Save Expense
                  </Button>
                </form>
              </div>
            </div>

            {/* Expense Ledger Table */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden ledger-container">
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex justify-between items-center">
                  <h2 className="font-bold">Expense Ledger</h2>
                  <div className="flex items-center gap-3">
                    <div className="bg-red-50 dark:bg-red-950/20 px-3 py-1 rounded-lg border border-red-100 dark:border-red-900/30">
                      <span className="text-xs font-semibold text-red-600 uppercase">
                        Total:{" "}
                      </span>
                      <span className="text-sm font-bold text-red-700 dark:text-red-400">
                        ₹{data.summary.totalExpenses.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-1 no-print">
                      <Button
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        onClick={() => exportToCSV("expenses")}
                      >
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        onClick={exportToPDF}
                      >
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.expenses.map((exp: any) => (
                        <tr
                          key={exp.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                            {exp.date}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {exp.description}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                              {exp.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-red-500">
                            ₹{exp.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {data.expenses.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-10 text-center text-muted-foreground italic"
                          >
                            No expenses found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sales" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {/* Register Manual Sale Form */}
            <div className="lg:col-span-1 no-print">
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm sticky top-24">
                <h2 className="text-lg font-bold mb-4">Register Manual Sale</h2>
                <form onSubmit={handleRegisterSale} className="space-y-4">
                  <Input
                    label="Customer Name"
                    placeholder="Walk-in"
                    value={saleForm.customerName}
                    onChange={(e) =>
                      setSaleForm({
                        ...saleForm,
                        customerName: e.target.value,
                      })
                    }
                    required
                  />
                  <Input
                    label="Description"
                    placeholder="e.g. Pharmacy Sale, Consultation..."
                    value={saleForm.description}
                    onChange={(e) =>
                      setSaleForm({
                        ...saleForm,
                        description: e.target.value,
                      })
                    }
                    required
                  />
                  <Input
                    label="Amount"
                    type="number"
                    placeholder="0.00"
                    value={saleForm.amount}
                    onChange={(e) =>
                      setSaleForm({ ...saleForm, amount: e.target.value })
                    }
                    required
                  />
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Payment Mode
                    </label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20"
                      value={saleForm.paymentMode}
                      onChange={(e) =>
                        setSaleForm({
                          ...saleForm,
                          paymentMode: e.target.value,
                        })
                      }
                    >
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Card</option>
                      <option>Bank Transfer</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full">
                    Register Sale
                  </Button>
                </form>
              </div>
            </div>

            {/* Sales History Table */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden ledger-container">
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex justify-between items-center">
                  <h2 className="font-bold">Sales History</h2>
                  <div className="flex items-center gap-3">
                    <div className="bg-green-50 dark:bg-green-950/20 px-3 py-1 rounded-lg border border-green-100 dark:border-green-900/30">
                      <span className="text-xs font-semibold text-green-600 uppercase">
                        Total:{" "}
                      </span>
                      <span className="text-sm font-bold text-green-700 dark:text-green-400">
                        ₹{data.summary.totalSales.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-1 no-print">
                      <Button
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        onClick={() => exportToCSV("sales")}
                      >
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        onClick={exportToPDF}
                      >
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Invoice #</th>
                        <th className="px-6 py-3">Patient/Customer</th>
                        <th className="px-6 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.sales.map((sale: any) => (
                        <tr
                          key={sale.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                            {
                              new Date(sale.createdAt)
                                .toISOString()
                                .split("T")[0]
                            }
                          </td>
                          <td className="px-6 py-4 font-mono text-sky-600">
                            {sale.invoiceNumber}
                          </td>
                          <td className="px-6 py-4">{sale.patientName}</td>
                          <td className="px-6 py-4 text-right font-bold text-green-600">
                            ₹{sale.totalAmount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {data.sales.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-10 text-center text-muted-foreground italic"
                          >
                            No sales records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
