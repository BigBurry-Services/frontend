"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
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
import { Label } from "@/components/ui/label";
import {
  Users,
  UserPlus,
  Save,
  X,
  UserCog,
  Stethoscope,
  Filter,
  Trash2,
} from "lucide-react";

export default function StaffManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
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
  const [roleFilter, setRoleFilter] = useState("all");

  const [editingUser, setEditingUser] = useState<any>(null);

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
      } else {
        // Create new user
        await axios.post(`${apiUrl}/users`, formData);
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
  };

  const handleDelete = async (username: string) => {
    if (!confirm(`Are you sure you want to remove staff member @${username}?`))
      return;
    try {
      await axios.delete(`${apiUrl}/users/${username}`);
      fetchStaff();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to remove staff");
    }
  };

  if (!user || user.role !== "admin") {
    return <div className="p-10">Access Denied: Admins only</div>;
  }

  return (
    <AppLayout>
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Form (Sticky) */}
          <div className="lg:col-span-1 lg:sticky lg:top-6">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 pb-4">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <UserCog className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Staff Details
                  </span>
                </div>
                <CardTitle className="text-xl">
                  {editingUser ? "Edit Staff Member" : "Add New Staff"}
                </CardTitle>
                <CardDescription>
                  {editingUser
                    ? "Update employee information and permissions"
                    : "Register a new employee in the system"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(val) =>
                        setFormData({ ...formData, role: val })
                      }
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="pharmacist">Pharmacist</SelectItem>
                        <SelectItem value="receptionist">
                          Receptionist
                        </SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="space-y-1">
                      <Label>Staff Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        placeholder=""
                        className="bg-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                      disabled={!!editingUser}
                      placeholder=""
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      {editingUser
                        ? "Password (Leave blank to keep)"
                        : "Password"}
                    </Label>
                    <div className="space-y-1">
                      <Label>Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        required={!editingUser}
                        placeholder=""
                        className="bg-background"
                      />
                    </div>
                  </div>

                  {formData.role === "doctor" && (
                    <div className="space-y-4 pt-2 border-t border-dashed">
                      <div className="flex items-center gap-2 text-sky-600">
                        <Stethoscope className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase">
                          Doctor Details
                        </span>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="specialization">Specialization</Label>
                        <div className="space-y-1">
                          <Label>Specialization</Label>
                          <Input
                            id="specialization"
                            value={formData.specialization}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                specialization: e.target.value,
                              })
                            }
                            required
                            placeholder=""
                            className="bg-background"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Select
                          value={formData.department}
                          onValueChange={(val) =>
                            setFormData({ ...formData, department: val })
                          }
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((d: any) => (
                              <SelectItem key={d.id} value={d.name}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fee">Consultation Fee (₹)</Label>
                        <div className="space-y-1">
                          <Label>Consultation Fee</Label>
                          <Input
                            id="fee"
                            type="number"
                            value={formData.consultationFee}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                consultationFee: e.target.value,
                              })
                            }
                            required
                            placeholder=""
                            className="bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? (
                        "Saving..."
                      ) : editingUser ? (
                        <>
                          <Save className="mr-2 h-4 w-4" /> Update Staff
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" /> Add Staff
                        </>
                      )}
                    </Button>
                    {editingUser && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEdit}
                        size="icon"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: List */}
          <div className="lg:col-span-2">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    Current Staff
                  </CardTitle>
                  <CardDescription>
                    Overview of all registered employees.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-md border">
                    <Filter className="h-3 w-3 text-muted-foreground" />
                    <select
                      className="bg-transparent text-xs font-medium focus:outline-none"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <option value="all">All Roles</option>
                      <option value="doctor">Doctors</option>
                      <option value="pharmacist">Pharmacists</option>
                      <option value="receptionist">Receptionists</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchStaff}>
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Desktop View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Role</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff
                        .filter(
                          (s: any) =>
                            roleFilter === "all" || s.role === roleFilter,
                        )
                        .map((s: any) => (
                          <TableRow key={s.id} className="group">
                            <TableCell>
                              <span className="capitalize inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                {s.role}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium text-slate-900">
                              {s.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs font-mono">
                              {s.username}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm">
                                  {s.specialization || "-"}
                                </span>
                                {s.consultationFee && (
                                  <span className="text-[10px] text-green-600 font-semibold bg-green-50 w-fit px-1.5 rounded-sm">
                                    ₹{s.consultationFee}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {s.department ? (
                                <span className="text-sky-600 font-medium text-sm">
                                  {s.department}
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic text-xs">
                                  Unassigned
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => startEdit(s)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDelete(s.username)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      {staff.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-12 text-muted-foreground"
                          >
                            No staff members found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {staff
                    .filter(
                      (s: any) => roleFilter === "all" || s.role === roleFilter,
                    )
                    .map((s: any) => (
                      <div
                        key={s.id}
                        className="flex flex-col space-y-3 p-4 border rounded-lg bg-card text-card-foreground shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="capitalize inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                {s.role}
                              </span>
                              {s.department && (
                                <span className="text-xs text-sky-600 font-medium border border-sky-100 bg-sky-50 px-2 py-0.5 rounded-full">
                                  {s.department}
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-lg">{s.name}</h3>
                            <p className="text-xs text-muted-foreground font-mono">
                              @{s.username}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(s)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-destructive border-destructive/20 hover:bg-destructive/10"
                              onClick={() => handleDelete(s.username)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {(s.specialization || s.consultationFee) && (
                          <div className="grid grid-cols-2 gap-2 text-sm bg-muted/30 p-2 rounded-md">
                            {s.specialization && (
                              <div>
                                <span className="text-xs text-muted-foreground block">
                                  Specialization
                                </span>
                                <span className="font-medium">
                                  {s.specialization}
                                </span>
                              </div>
                            )}
                            {s.consultationFee && (
                              <div>
                                <span className="text-xs text-muted-foreground block">
                                  Fee
                                </span>
                                <span className="font-medium text-green-600">
                                  ₹{s.consultationFee}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  {staff.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                      No staff members found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
