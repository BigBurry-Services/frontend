"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { AppSidebar } from "./Sidebar";
import { usePathname } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export const AppLayout = ({
  children,
  extraSidebarContent,
}: {
  children: React.ReactNode;
  extraSidebarContent?: React.ReactNode;
}) => {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  // Hide sidebar on login page and root
  const hideSidebar = pathname === "/login" || pathname === "/";

  if (loading) return null;

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={user}
        logout={logout}
        extraContent={extraSidebarContent}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4 md:hidden no-print">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {/* Breadcrumb could go here */}
          </div>
        </header>
        <div className="flex-1 flex flex-col gap-2 md:gap-4 p-1 md:p-4 md:pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
