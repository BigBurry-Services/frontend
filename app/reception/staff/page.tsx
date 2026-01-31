"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function StaffManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: "doctor",
    specialization: "",
    department: "",
    consultationFee: "",
  });
  const [loading, setLoading] = useState(false);

  const [editingUser, setEditingUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const apiUrl = "/api";

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${apiUrl}/departments`);
      setDepartments(res.data);
    } catch (error) {
      console.error("Failed to fetch departments");
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await axios.get(`${apiUrl}/users`);
      setStaff(res.data);
    } catch (error) {
      console.error("Failed to fetch staff");
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchDepartments();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        // Update existing user
        await axios.patch(`${apiUrl}/users/${editingUser.username}`, formData);
        alert("Staff Member Updated Successfully");
      } else {
        // Create new user
        await axios.post(`${apiUrl}/users`, formData);
        alert("Staff Member Added Successfully");
      }

      setFormData({
        username: "",
        password: "",
        name: "",
        role: "doctor",
        specialization: "",
        department: "",
        consultationFee: "",
      });
      setEditingUser(null);
      setIsModalOpen(false);
      fetchStaff();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to save staff");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "", // specific logic might be needed if password update is optional
      name: user.name,
      role: user.role,
      specialization: user.specialization || "",
      department: user.department || "",
      consultationFee: user.consultationFee || "",
    });
    setIsModalOpen(true);
  };

  const openNewStaffModal = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      password: "",
      name: "",
      role: "doctor",
      specialization: "",
      department: "",
      consultationFee: "",
    });
    setIsModalOpen(true);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      password: "",
      name: "",
      role: "doctor",
      specialization: "",
      department: "",
      consultationFee: "",
    });
    setIsModalOpen(false);
  };

  if (!user || user.role !== "admin") {
    return <div className="p-10">Access Denied: Admins only</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-sky-600">Manage Staff</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Back to Dashboard
        </Button>
      </nav>

      <main className="p-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Registration Form */}
        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">
            {editingUser ? "Edit Staff Member" : "Add New Staff"}
          </h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Role</label>
              <select
                className="w-full h-10 rounded-md border border-slate-300 px-3 bg-white text-sm"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <option value="doctor">Doctor</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="receptionist">Receptionist</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <Input
              label="Username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
              disabled={!!editingUser} // Verify if username edit is allowed. Usually unique ID, so disable.
            />
            <Input
              label={
                editingUser
                  ? "Password (Leave blank to keep current)"
                  : "Password"
              }
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required={!editingUser}
            />
            {formData.role === "doctor" && (
              <>
                <Input
                  label="Specialization"
                  value={formData.specialization}
                  onChange={(e) =>
                    setFormData({ ...formData, specialization: e.target.value })
                  }
                  required
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Department
                  </label>
                  <select
                    className="w-full h-10 rounded-md border border-slate-300 px-3 bg-white text-sm"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((d: any) => (
                      <option key={d._id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Consultation Fee (₹)"
                  type="number"
                  value={formData.consultationFee}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      consultationFee: e.target.value,
                    })
                  }
                  required
                />
              </>
            )}

            <div className="flex gap-2 mt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Saving..."
                  : editingUser
                    ? "Update Staff"
                    : "Add Staff Member"}
              </Button>
              {editingUser && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Staff List */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Current Staff
            </h2>
            <Button variant="ghost" onClick={fetchStaff}>
              Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Specialization</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s: any) => (
                  <tr
                    key={s._id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <span className="capitalize px-2 py-1 bg-slate-100 rounded-md text-xs font-medium">
                        {s.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{s.username}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {s.specialization || "-"}
                      {s.consultationFee && (
                        <div className="text-xs text-green-600 font-semibold mt-1">
                          Fee: ₹{s.consultationFee}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {s.department ? (
                        <span className="text-sky-600 font-medium">
                          {s.department}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 h-8 text-xs"
                        onClick={() => startEdit(s)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
