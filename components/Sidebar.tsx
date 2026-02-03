"use client";

import React from "react";
import {
  FaChartPie,
  FaWallet,
  FaHistory,
  FaHospitalUser,
  FaUserMd,
  FaPills,
  FaCalculator,
  FaSignOutAlt,
  FaHome,
  FaBed,
  FaUsers,
  FaMicroscope,
  FaHospital,
  FaTimes,
} from "react-icons/fa";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface SidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  user?: any;
  logout?: () => void;
  isAccounting?: boolean;
  extraContent?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  logout,
  extraContent,
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isActive = (path: string) => {
    if (path.includes("?")) {
      const [baseUrl, query] = path.split("?");
      const params = new URLSearchParams(query);
      const tab = params.get("tab");
      return pathname === baseUrl && searchParams.get("tab") === tab;
    }
    return pathname === path || (path !== "/" && pathname.startsWith(path));
  };

  const mainModules = [
    {
      name: "Overview",
      icon: FaChartPie,
      path: "/reception?tab=registration",
      roles: ["admin", "receptionist"],
    },
    {
      name: "Patients",
      icon: FaHospitalUser,
      path: "/reception?tab=patients",
      roles: ["admin", "receptionist"],
    },
    {
      name: "Bed Status",
      icon: FaBed,
      path: "/reception?tab=beds",
      roles: ["admin", "receptionist"],
    },
    {
      name: "Pharmacy",
      icon: FaPills,
      path: "/pharmacy",
      roles: ["admin", "pharmacist"],
    },
    {
      name: "Accounting",
      icon: FaCalculator,
      path: "/accounting",
      roles: ["admin"],
    },
  ];

  const adminModules = [
    {
      name: "Manage Staff",
      icon: FaUsers,
      path: "/reception/staff",
      roles: ["admin"],
    },
    {
      name: "Manage Beds",
      icon: FaHome,
      path: "/reception/resources",
      roles: ["admin"],
    },
    {
      name: "Manage Services",
      icon: FaMicroscope,
      path: "/reception/services",
      roles: ["admin"],
    },
    {
      name: "Manage Departments",
      icon: FaHospital,
      path: "/reception/departments",
      roles: ["admin"],
    },
  ];

  const accountingTabs = [
    { id: "overview", name: "Overview", icon: FaChartPie },
    { id: "expenses", name: "Expenses", icon: FaWallet },
    { id: "sales", name: "Sales History", icon: FaHistory },
  ];

  const receptionTabs = [
    { id: "registration", name: "Overview", icon: FaChartPie },
    { id: "patients", name: "Patients List", icon: FaHospitalUser },
    { id: "beds", name: "Bed Status", icon: FaBed },
  ];

  const currentModule = mainModules.find((m) => pathname.startsWith(m.path));
  const isAccounting = pathname.startsWith("/accounting");
  const isReception =
    pathname.startsWith("/reception") &&
    !pathname.includes("/billing") &&
    !pathname.includes("/staff") &&
    !pathname.includes("/resources") &&
    !pathname.includes("/departments") &&
    !pathname.includes("/services");
  const isDoctor = pathname.startsWith("/doctor");
  const isPharmacy = pathname.startsWith("/pharmacy");

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "w-64 h-screen bg-[#0f172a] text-slate-300 flex flex-col no-print border-r border-slate-800 z-50 transition-transform duration-300",
          "fixed top-0 left-0 lg:sticky",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <img
              src="/phoenix_logo.svg"
              alt="Logo"
              className="w-10 h-10 object-contain bg-white rounded-md p-1"
            />
            <span className="text-xl font-bold text-white tracking-tight">
              Phoenix HMS
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-slate-400 hover:text-white"
            >
              <FaTimes size={20} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Main Modules Section */}
          <div className="px-6 mb-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Main Modules
            </h3>
            <div className="space-y-1">
              {mainModules
                .filter((m) => !user || m.roles.includes(user.role))
                .map((module) => (
                  <button
                    key={module.path}
                    onClick={() => router.push(module.path)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      isActive(module.path)
                        ? "bg-sky-500/10 text-sky-400"
                        : "hover:bg-slate-800/50 hover:text-white",
                    )}
                  >
                    <module.icon
                      className={cn(
                        "text-lg",
                        isActive(module.path)
                          ? "text-sky-400"
                          : "text-slate-500",
                      )}
                    />
                    {module.name}
                  </button>
                ))}
            </div>
          </div>

          {/* Administration Section */}
          {user?.role === "admin" && (
            <div className="px-6 mb-6">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 border-t border-slate-800/50 pt-6">
                Manage Resources
              </h3>
              <div className="space-y-1">
                {adminModules.map((module) => (
                  <button
                    key={module.path}
                    onClick={() => router.push(module.path)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                      isActive(module.path)
                        ? "bg-sky-500/10 text-sky-400"
                        : "hover:bg-slate-800/50 hover:text-white",
                    )}
                  >
                    <module.icon
                      className={cn(
                        "text-lg",
                        isActive(module.path)
                          ? "text-sky-400"
                          : "text-slate-500",
                      )}
                    />
                    {module.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Content (e.g., Doctor Queue) */}
          {extraContent && (
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0 border-t border-slate-800/50 bg-slate-900/20">
              {extraContent}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase">
              {user?.username?.substring(0, 2) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.username || "Small HMS User"}
              </p>
              <p className="text-xs text-slate-500 truncate capitalize">
                {user?.role || "Admin"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};
