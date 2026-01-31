"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function DepartmentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const apiUrl = "/api";

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${apiUrl}/departments`);
      setDepartments(res.data);
    } catch (error) {
      console.error("Failed to fetch departments");
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${apiUrl}/departments`, formData);
      alert("Department Created Successfully");
      setFormData({ name: "", description: "" });
      fetchDepartments();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create department");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await axios.delete(`${apiUrl}/departments/${id}`);
      fetchDepartments();
    } catch (error) {
      alert("Failed to delete department");
    }
  };

  if (!user || user.role !== "admin") {
    return <div className="p-10">Access Denied: Admins only</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-sky-600">Manage Departments</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Back to Dashboard
        </Button>
      </nav>

      <main className="p-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Creation Form */}
        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">
            Add New Department
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Department Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="e.g. Cardiology"
            />
            <Input
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description..."
            />
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Creating..." : "Create Department"}
            </Button>
          </form>
        </div>

        {/* Departments List */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Existing Departments
            </h2>
            <Button variant="ghost" onClick={fetchDepartments}>
              Refresh
            </Button>
          </div>

          <div className="space-y-3">
            {departments.length > 0 ? (
              departments.map((dept: any) => (
                <div
                  key={dept._id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {dept.name}
                    </h3>
                    {dept.description && (
                      <p className="text-sm text-slate-500">
                        {dept.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(dept._id)}
                  >
                    Delete
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-8">
                No departments found. Add one to get started.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
