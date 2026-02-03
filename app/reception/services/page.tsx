"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";

export default function ServicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const apiUrl = "/api/services";

  const fetchServices = async () => {
    try {
      const res = await axios.get(apiUrl);
      setServices(res.data);
    } catch (error) {
      console.error("Failed to fetch services");
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(apiUrl, {
        ...formData,
        price: Number(formData.price),
      });
      setFormData({ name: "", price: "", description: "" });
      fetchServices();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create service");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await axios.delete(`${apiUrl}?id=${id}`);
      fetchServices();
    } catch (error) {
      alert("Failed to delete service");
    }
  };

  if (!user || user.role !== "admin") {
    return <div className="p-10">Access Denied: Admins only</div>;
  }

  return (
    <AppLayout>
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 no-print">
        <h1 className="text-xl font-bold text-slate-800">Manage Services</h1>
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
            Add New Service
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Service Name"
              value={formData.name}
              onChange={(e: any) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="e.g. X-Ray, Blood Test"
            />
            <Input
              label="Price (Rs.)"
              type="number"
              value={formData.price}
              onChange={(e: any) =>
                setFormData({ ...formData, price: e.target.value })
              }
              required
              placeholder="500"
            />
            <Input
              label="Description (Optional)"
              value={formData.description}
              onChange={(e: any) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description..."
            />
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Creating..." : "Create Service"}
            </Button>
          </form>
        </div>

        {/* Services List */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Service Catalog
            </h2>
            <Button variant="ghost" onClick={fetchServices}>
              Refresh
            </Button>
          </div>

          <div className="space-y-3">
            {services.length > 0 ? (
              services.map((svc: any) => (
                <div
                  key={svc.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-slate-900">
                        {svc.name}
                      </h3>
                      <span className="text-sky-600 font-bold">
                        Rs. {svc.price}
                      </span>
                    </div>
                    {svc.description && (
                      <p className="text-sm text-slate-500 mt-1">
                        {svc.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-4"
                    onClick={() => handleDelete(svc.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-8">
                No services found. Add one to get started.
              </p>
            )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
