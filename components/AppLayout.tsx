"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FaBars } from "react-icons/fa";

export const AppLayout = ({
  children,
  extraSidebarContent,
}: {
  children: React.ReactNode;
  extraSidebarContent?: React.ReactNode;
}) => {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Hide sidebar on login page and root
  const hideSidebar = pathname === "/login" || pathname === "/";

  if (loading) return null;

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative">
      <Sidebar
        user={user}
        logout={logout}
        extraContent={extraSidebarContent}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="lg:hidden bg-[#0f172a] p-4 flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold">
              L
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Lite HMS
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-300 hover:text-white"
          >
            <FaBars size={24} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
};
