"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppLayout } from "@/components/AppLayout";

export default function PharmacyDashboard() {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const apiUrl = "/api";

  const fetchData = async () => {
    try {
      const [catRes, medRes] = await Promise.all([
        axios.get(`${apiUrl}/categories`),
        axios.get(`${apiUrl}/inventory`),
      ]);
      setCategories(catRes.data);
      setMedicines(medRes.data);
    } catch (error) {
      console.error("Failed to fetch data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await axios.post(`${apiUrl}/categories`, {
        name: newCategoryName,
      });
      setNewCategoryName("");
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Failed to add category");
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "pharmacist")) {
    return <div className="p-10">Access Denied</div>;
  }

  const nearExpiryMedicines = medicines.filter((m: any) => {
    if (!m.expiryDate) return false;
    const expiry = new Date(m.expiryDate);
    const now = new Date();
    const twoMonthsFromNow = new Date(
      now.getFullYear(),
      now.getMonth() + 2,
      now.getDate(),
    );
    return expiry >= now && expiry <= twoMonthsFromNow;
  });

  const filteredMedicines = searchTerm.trim()
    ? medicines.filter(
        (m: any) =>
          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (m.batchNumber &&
            m.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    : [];

  return (
    <AppLayout>
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800">
            Pharmacy Dashboard
          </h1>
          <span className="text-slate-400">|</span>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Pharmacist {user.username}
          </span>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsModalOpen(true)}>
            + Add New Category
          </Button>
          <ThemeToggle />
        </div>
      </nav>

      <div className="bg-sky-600 px-6 py-8">
        <div>
          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-sky-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search medicines by name or batch number..."
              className="block w-full pl-11 pr-4 py-4 bg-white/10 border border-sky-400/30 rounded-2xl text-white placeholder-sky-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all backdrop-blur-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <main className="p-6 space-y-6">
        {/* Search Results */}
        {searchTerm.trim() !== "" && (
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                Search Results ({filteredMedicines.length})
              </h2>
              <button
                onClick={() => setSearchTerm("")}
                className="text-sm text-sky-600 font-semibold hover:underline"
              >
                Clear Search
              </button>
            </div>

            {filteredMedicines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMedicines.map((m: any) => {
                  const category = categories.find(
                    (c) => c.id === m.categoryID,
                  );
                  return (
                    <Link
                      key={m.id}
                      href={`/pharmacy/category/${m.categoryID}`}
                      className="group p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-sky-50 hover:border-sky-200 transition-all flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors capitalize">
                          {m.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            {category?.name || "Uncategorized"}
                          </span>
                          {m.batchNumber && (
                            <span className="text-[10px] text-slate-400">
                              #{m.batchNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-600">
                          ₹{m.unitPrice}
                        </p>
                        <p
                          className={`text-[10px] mt-0.5 ${new Date(m.expiryDate) < new Date() ? "text-red-500 font-bold" : "text-slate-400"}`}
                        >
                          Exp: {new Date(m.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 italic">
                No medicines found matching "{searchTerm}"
              </div>
            )}
          </div>
        )}

        {/* Near Expiry Alert Section */}
        {nearExpiryMedicines.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-amber-900">
                  Global Expiry Alerts
                </h2>
                <p className="text-sm text-amber-700">
                  Medicines across all categories expiring within 2 months
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearExpiryMedicines.map((m: any) => (
                <div
                  key={m.id}
                  className="bg-white border border-amber-100 rounded-lg p-3 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">
                      {m.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {categories.find((c: any) => c.id === m.categoryID)
                        ?.name || "Uncategorized"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-amber-600">
                      {new Date(m.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800">
            Medicine Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat: any) => {
              const count = medicines.filter(
                (m) => m.categoryID === cat.id,
              ).length;
              return (
                <Link
                  key={cat.id}
                  href={`/pharmacy/category/${cat.id}`}
                  className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-300 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-sky-50 rounded-xl text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
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
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1 capitalize">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-slate-500">{count} Medicines</p>
                  <div className="mt-4 flex items-center text-sky-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    View Catalogue
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              );
            })}

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-sky-300 hover:text-sky-500 hover:bg-sky-50 transition-all"
            >
              <svg
                className="w-8 h-8 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="font-semibold text-sm">Add Category</span>
            </button>
          </div>

          {categories.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="mb-4 inline-flex p-4 bg-slate-50 rounded-full text-slate-300">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                No Categories Yet
              </h3>
              <p className="text-slate-500 max-w-xs mx-auto mb-6">
                Create your first category to start organizing your medicine
                catalogue.
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                Create Category
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                Add New Category
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleAddCategory} className="p-6">
              <Input
                label="Category Name"
                placeholder="e.g. Ayurveda"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
                autoFocus
              />
              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
