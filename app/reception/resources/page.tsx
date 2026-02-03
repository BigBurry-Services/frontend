"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";

export default function ManageBeds() {
  const { user } = useAuth();
  const router = useRouter();
  const [beds, setBeds] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    resourceID: "",
    type: "ward_bed",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");

  const apiUrl = "/api";

  const fetchBeds = async () => {
    try {
      const res = await axios.get(`${apiUrl}/resources`);
      setBeds(res.data);
    } catch (error) {
      console.error("Failed to fetch beds");
    }
  };

  useEffect(() => {
    fetchBeds();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`${apiUrl}/resources/${formData.resourceID}`, formData);
        setIsEditing(false);
        setEditId("");
      } else {
        await axios.post(`${apiUrl}/resources`, formData);
      }
      setFormData({ name: "", resourceID: "", type: "ward_bed" });
      fetchBeds();
    } catch (error: any) {
      alert(
        `Failed to ${isEditing ? "update" : "create"} bed: ${error.response?.data?.message || error.message}`,
      );
    }
  };

  const handleEdit = (bed: any) => {
    setFormData({
      name: bed.name,
      resourceID: bed.resourceID,
      type: bed.type,
    });
    setIsEditing(true);
    setEditId(bed.resourceID);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditId("");
    setFormData({ name: "", resourceID: "", type: "ward_bed" });
  };

  if (!user || user.role !== "admin") {
    return <div className="p-10">Access Denied</div>;
  }

  return (
    <AppLayout>
      <main className="p-6 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">
            {isEditing ? "Edit Resource" : "Add New Resource"}
          </h2>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <Input
              label="Resource ID (Unique)"
              placeholder="e.g. BED-101"
              value={formData.resourceID}
              onChange={(e) =>
                setFormData({ ...formData, resourceID: e.target.value })
              }
              required
              disabled={isEditing}
            />
            <Input
              label="Name/Label"
              placeholder="e.g. Ward A - Bed 1"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <div className="space-y-1 w-48">
              <label className="text-sm font-medium text-slate-700">Type</label>
              <select
                className="w-full h-10 rounded-md border border-slate-300 px-3 bg-white text-sm"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                <option value="ward_bed">General Ward</option>
                <option value="icu_bed">ICU Bed</option>
                <option value="private_room">Private Room</option>
              </select>
            </div>
            <Button type="submit" className="mb-[2px]">
              {isEditing ? "Update Resource" : "Add Resource"}
            </Button>
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                className="mb-[2px]"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            )}
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">
            Existing Resources
          </h2>
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {beds.map((bed: any) => (
                <tr
                  key={bed.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {bed.resourceID}
                  </td>
                  <td className="px-4 py-3">{bed.name}</td>
                  <td className="px-4 py-3 capitalize">
                    {bed.type.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3">
                    {bed.isOccupied ? (
                      <span className="text-red-600 font-medium">Occupied</span>
                    ) : (
                      <span className="text-green-600 font-medium">
                        Available
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" onClick={() => handleEdit(bed)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </AppLayout>
  );
}
