"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEffect, useState } from "react";
import axios from "axios";

export default function PharmacyDashboard() {
  const { user, logout } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    stock: "",
    unitPrice: "",
    batchNumber: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");

  const apiUrl = "/api";

  const fetchMedicines = async () => {
    try {
      const res = await axios.get(`${apiUrl}/inventory`);
      setMedicines(res.data);
    } catch (error) {
      console.error("Failed to fetch medicines");
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.patch(`${apiUrl}/inventory/${editId}`, {
          ...formData,
          stock: Number(formData.stock),
          unitPrice: Number(formData.unitPrice),
        });
        alert("Medicine Updated Successfully");
        setIsEditing(false);
        setEditId("");
      } else {
        await axios.post(`${apiUrl}/inventory`, {
          ...formData,
          stock: Number(formData.stock),
          unitPrice: Number(formData.unitPrice),
        });
        alert("Medicine Added Successfully");
      }
      setFormData({ name: "", stock: "", unitPrice: "", batchNumber: "" });
      fetchMedicines();
    } catch (error) {
      alert(`Failed to ${isEditing ? "update" : "add"} medicine`);
    }
  };

  const handleEdit = (medicine: any) => {
    setFormData({
      name: medicine.name,
      stock: medicine.stock,
      unitPrice: medicine.unitPrice,
      batchNumber: medicine.batchNumber || "",
    });
    setIsEditing(true);
    setEditId(medicine._id);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditId("");
    setFormData({ name: "", stock: "", unitPrice: "", batchNumber: "" });
  };

  if (!user || (user.role !== "admin" && user.role !== "pharmacist")) {
    return <div className="p-10">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-sky-600">Pharmacy Dashboard</h1>
        <div className="flex gap-4 items-center">
          <span className="text-slate-600">Pharmacist {user.username}</span>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add Medicine Form */}
        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">
            {isEditing ? "Edit Inventory" : "Add Inventory"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Medicine Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <Input
              label="Batch Number"
              value={formData.batchNumber}
              onChange={(e) =>
                setFormData({ ...formData, batchNumber: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Stock Qty"
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                required
              />
              <Input
                label="Unit Price (₹)"
                type="number"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({ ...formData, unitPrice: e.target.value })
                }
                required
              />
            </div>
            <Button type="submit" className="w-full mt-2">
              {isEditing ? "Update Stock" : "Add Stock"}
            </Button>
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            )}
          </form>
        </div>

        {/* Inventory List */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Current Stock
            </h2>
            <Button variant="ghost" onClick={fetchMedicines}>
              Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m: any) => (
                  <tr
                    key={m._id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {m.name}
                    </td>
                    <td className="px-4 py-3">{m.batchNumber}</td>
                    <td className="px-4 py-3">{m.stock}</td>
                    <td className="px-4 py-3">₹{m.unitPrice}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${m.stock < 10 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                      >
                        {m.stock < 10 ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => handleEdit(m)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
                {medicines.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-slate-400">
                      No stock found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
