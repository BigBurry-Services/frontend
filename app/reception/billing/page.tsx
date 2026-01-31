"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
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
  const [summary, setSummary] = useState<{
    totalPaid: number;
    totalPending: number;
    recentInvoices?: any[];
  }>({ totalPaid: 0, totalPending: 0, recentInvoices: [] });

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
          `${apiUrl}/billing/pending-dues/${selectedPatientId}`,
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
          `${apiUrl}/billing/summary/${selectedPatientId}`,
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

  const calculateTotal = () => {
    return items
      .filter((item: any) => item.selected)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedPatient: any = patients.find(
        (p: any) => p.patientID === selectedPatientId,
      );
      if (!selectedPatient) return alert("Select a patient");

      await axios.post(`${apiUrl}/billing`, {
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
        totalAmount: calculateTotal(),
      });
      alert("Invoice Generated Successfully");
      router.push("/reception");
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800">Generate Invoice</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Back to Dashboard
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Select Patient
            </label>
            <select
              className="w-full h-10 rounded-md border border-slate-300 px-3 bg-white text-sm focus:ring-2 focus:ring-sky-500"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              required
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p: any) => (
                <option key={p._id} value={p.patientID}>
                  {p.name} ({p.patientID})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Summary */}
          {selectedPatientId && (
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase">
                  Total Paid
                </span>
                <span className="text-xl font-bold text-green-600">
                  ₹{summary.totalPaid}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase">
                  Current Dues
                </span>
                <span className="text-xl font-bold text-amber-600">
                  ₹{summary.totalPending}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-700">
                Bill Items
              </h3>
              <Button type="button" variant="secondary" onClick={handleAddItem}>
                + Add Item
              </Button>
            </div>
            {items.map((item: any, index) => (
              <div key={index} className="flex gap-4 items-center">
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={(e) =>
                    handleItemChange(index, "selected", e.target.checked)
                  }
                  className="w-5 h-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <Input
                  placeholder="Description (e.g. Consultation Fee)"
                  className="flex-1"
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(index, "description", e.target.value)
                  }
                  required
                />
                <Input
                  placeholder="Amount"
                  type="number"
                  className="w-32"
                  value={item.amount}
                  onChange={(e) =>
                    handleItemChange(index, "amount", e.target.value)
                  }
                  required
                />
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Payment Mode
            </label>
            <select
              className="w-full h-10 rounded-md border border-slate-300 px-3 bg-white text-sm focus:ring-2 focus:ring-sky-500"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              required
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
              <option value="Insurance">Insurance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-4 rounded-lg">
            <span className="font-bold text-lg text-slate-700">
              Total Amount
            </span>
            <span className="font-bold text-2xl text-sky-600">
              ₹{calculateTotal()}
            </span>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={loading}
          >
            {loading
              ? "Generating Invoice..."
              : "Mark as Paid & Generate Invoice"}
          </Button>

          {/* Payment History */}
          {summary.recentInvoices && summary.recentInvoices.length > 0 && (
            <div className="pt-8 border-t border-slate-200">
              <h3 className="text-md font-semibold text-slate-700 mb-4">
                Recent Invoices (Paid History)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Invoice #</th>
                      <th className="px-4 py-3">Items</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentInvoices.map((inv: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-100">
                        <td className="px-4 py-3">
                          {new Date(inv.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-3">{inv.items}</td>
                        <td className="px-4 py-3">{inv.paymentMode}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">
                          ₹{inv.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
