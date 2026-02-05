"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";

export default function TreatmentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [treatments, setTreatments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apiUrl = "/api/treatments";

  const fetchTreatments = async () => {
    try {
      const res = await axios.get(apiUrl);
      setTreatments(res.data);
    } catch (error) {
      console.error("Failed to fetch treatments");
    }
  };

  useEffect(() => {
    fetchTreatments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(apiUrl, {
          id: editingId,
          ...formData,
          price: Number(formData.price),
        });
      } else {
        await axios.post(apiUrl, {
          ...formData,
          price: Number(formData.price),
        });
      }
      setFormData({ name: "", price: "", description: "" });
      setEditingId(null);
      fetchTreatments();
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          `Failed to ${editingId ? "update" : "create"} treatment`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tmt: any) => {
    setFormData({
      name: tmt.name,
      price: tmt.price.toString(),
      description: tmt.description || "",
    });
    setEditingId(tmt.id);
  };

  const handleCancelEdit = () => {
    setFormData({ name: "", price: "", description: "" });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await axios.delete(`${apiUrl}?id=${id}`);
      fetchTreatments();
    } catch (error) {
      alert("Failed to delete treatment");
    }
  };

  if (!user || user.role !== "admin") {
    return <div className="p-10">Access Denied: Admins only</div>;
  }

  return (
    <AppLayout>
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 no-print">
        <h1 className="text-xl font-bold text-slate-800">Manage Treatments</h1>
        <div className="flex gap-4 items-center">
          <Button
            variant="ghost"
            className="text-sm font-semibold text-slate-500 hover:text-sky-600"
            onClick={() => router.back()}
          >
            Back
          </Button>
        </div>
      </nav>

      <main className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Creation Form */}
        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">
            {editingId ? "Edit Treatment" : "Add New Treatment"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Treatment Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder=""
              />
            </div>
            <div className="space-y-1">
              <Label>Price (Rs.)</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
                placeholder=""
              />
            </div>
            <div className="space-y-1">
              <Label>Description (Optional)</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder=""
              />
            </div>
            <div className="flex gap-2 mt-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                    ? "Update Treatment"
                    : "Create Treatment"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Treatments List */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Treatment Catalog
            </h2>
            <Button variant="ghost" onClick={fetchTreatments}>
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {treatments.length > 0 ? (
              treatments.map((tmt: any) => (
                <div
                  key={tmt.id}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-between h-full"
                >
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-slate-900 text-lg">
                        {tmt.name}
                      </h3>
                      <span className="bg-sky-100 text-sky-700 px-2 py-1 rounded text-xs font-bold">
                        Rs. {tmt.price}
                      </span>
                    </div>
                    {tmt.description && (
                      <p className="text-sm text-slate-500">
                        {tmt.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-slate-200 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-blue-50 hover:text-blue-700 border-blue-200"
                      onClick={() => handleEdit(tmt)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-red-50 hover:text-red-700 border-red-200"
                      onClick={() => handleDelete(tmt.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-8 col-span-full">
                No treatments found. Add one to get started.
              </p>
            )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
