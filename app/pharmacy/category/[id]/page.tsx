"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEffect, useState, use } from "react";
import axios from "axios";
import Link from "next/link";

export default function CategoryMedicinesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, logout } = useAuth();
  const { id } = use(params);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    categoryID: id,
    unitPrice: "",
    batchNumber: "",
    expiryDate: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const apiUrl = "/api";

  const fetchData = async () => {
    try {
      const [medRes, catRes] = await Promise.all([
        axios.get(`${apiUrl}/inventory`),
        axios.get(`${apiUrl}/categories`),
      ]);
      const categoryData = catRes.data.find((c: any) => c.id === id);
      setCategory(categoryData);
      setMedicines(medRes.data.filter((m: any) => m.categoryID === id));
    } catch (error) {
      console.error("Failed to fetch data");
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        unitPrice: Number(formData.unitPrice),
      };

      if (isEditing) {
        await axios.patch(`${apiUrl}/inventory/${editId}`, payload);
      } else {
        await axios.post(`${apiUrl}/inventory`, payload);
      }
      closeModal();
      fetchData();
    } catch (error) {
      alert(`Failed to ${isEditing ? "update" : "add"} medicine`);
    }
  };

  const handleEdit = (medicine: any) => {
    setFormData({
      name: medicine.name,
      categoryID: medicine.categoryID,
      unitPrice: medicine.unitPrice,
      batchNumber: medicine.batchNumber || "",
      expiryDate: medicine.expiryDate
        ? new Date(medicine.expiryDate).toISOString().split("T")[0]
        : "",
    });
    setIsEditing(true);
    setEditId(medicine.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (medId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}"?`)) {
      return;
    }
    try {
      await axios.delete(`${apiUrl}/inventory/${medId}`);
      fetchData();
    } catch (error) {
      alert("Failed to remove medicine");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditId("");
    setFormData({
      name: "",
      categoryID: id,
      unitPrice: "",
      batchNumber: "",
      expiryDate: "",
    });
  };

  if (!user || (user.role !== "admin" && user.role !== "pharmacist")) {
    return <div className="p-10">Access Denied</div>;
  }

  if (!category) {
    return <div className="p-10 text-center">Loading category...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/pharmacy"
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-sky-600 capitalize">
            {category.name} Catalogue
          </h1>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsModalOpen(true)}>+ Add Medicine</Button>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </nav>

      <main className="p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-800">
              Medicines in {category.name}
            </h2>
            <Button
              variant="ghost"
              className="text-sky-600"
              onClick={fetchData}
            >
              Refresh Data
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-4">Medicine Name</th>
                  <th className="px-6 py-4">Batch #</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4">Unit Price</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map((m: any) => {
                  const isExpired =
                    m.expiryDate && new Date(m.expiryDate) < new Date();
                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">
                            {m.name}
                          </span>
                          {isExpired && (
                            <span className="text-[10px] text-red-600 font-bold uppercase tracking-tighter">
                              Expired
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {m.batchNumber}
                      </td>
                      <td
                        className={`px-6 py-4 ${isExpired ? "text-red-600 font-bold" : "text-slate-600"}`}
                      >
                        {m.expiryDate
                          ? new Date(m.expiryDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        ₹{m.unitPrice}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            className="text-sky-600 hover:bg-sky-50 h-8 px-3"
                            onClick={() => handleEdit(m)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-red-500 hover:bg-red-50 h-8 px-3 font-semibold"
                            onClick={() => handleDelete(m.id, m.name)}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {medicines.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-20 text-slate-400 italic"
                    >
                      No medicines found in this category. Click "+ Add
                      Medicine" to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Medicine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                {isEditing
                  ? "Update Medicine Details"
                  : "Register New Medicine"}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Medicine Name"
                placeholder="e.g. Paracetamol 500mg"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Batch Number"
                  placeholder="B-1234"
                  value={formData.batchNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, batchNumber: e.target.value })
                  }
                />
                <Input
                  label="Expiry Date"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  required
                />
              </div>

              <Input
                label="Unit Price (₹)"
                type="number"
                placeholder="0.00"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({ ...formData, unitPrice: e.target.value })
                }
                required
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {isEditing ? "Save Changes" : "Register Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
