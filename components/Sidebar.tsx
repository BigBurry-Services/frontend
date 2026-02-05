"use client";

import React from "react";
import {
  FaChartPie,
  FaWallet,
  FaHistory,
  FaHospitalUser,
  FaPills,
  FaCalculator,
  FaSignOutAlt,
  FaHome,
  FaBed,
  FaUsers,
  FaMicroscope,
  FaHospital,
  FaStethoscope,
  FaArchive,
  FaBriefcaseMedical,
  FaFileInvoice,
} from "react-icons/fa";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User2, ChevronUp } from "lucide-react";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: any;
  logout?: () => void;
  extraContent?: React.ReactNode;
}

export function AppSidebar({
  user,
  logout,
  extraContent,
  ...props
}: AppSidebarProps) {
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
      name: "Billing",
      icon: FaWallet,
      path: "/reception/billing",
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
    {
      name: "Reports",
      icon: FaFileInvoice,
      path: "/reports",
      roles: ["admin", "receptionist"],
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
      name: "Manage Treatments",
      icon: FaStethoscope,
      path: "/reception/treatments",
      roles: ["admin"],
    },
    {
      name: "Manage Packages",
      icon: FaBriefcaseMedical,
      path: "/reception/packages",
      roles: ["admin"],
    },
    {
      name: "Manage Departments",
      icon: FaHospital,
      path: "/reception/departments",
      roles: ["admin"],
    },
  ];

  return (
    <Sidebar collapsible="icon" className="no-print" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="h-20 py-2 hover:bg-transparent"
            >
              <div className="flex w-full items-center justify-center">
                <img
                  src="/phoenix_logo.svg"
                  alt="Logo"
                  className="h-full w-auto max-w-full object-contain px-2"
                />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainModules
                .filter((m) => !user || m.roles.includes(user.role))
                .map((module) => (
                  <SidebarMenuItem key={module.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(module.path)}
                      tooltip={module.name}
                      onClick={() => router.push(module.path)}
                    >
                      <button>
                        <module.icon className="h-4 w-4" />
                        <span>{module.name}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminModules.map((module) => (
                  <SidebarMenuItem key={module.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(module.path)}
                      tooltip={module.name}
                      onClick={() => router.push(module.path)}
                    >
                      <button>
                        <module.icon className="h-4 w-4" />
                        <span>{module.name}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <ThemeToggle />
                  <span className="text-sm font-medium">Toggle Theme</span>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Extra Content Area (Doctor Queue etc) */}
        {extraContent && (
          <SidebarGroup>
            <SidebarGroupLabel>Active Tasks</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2">{extraContent}</div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground uppercase">
                    {user?.username?.substring(0, 2) || "U"}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate">{user?.username || "Use"}</span>
                    <span className="truncate text-xs capitalize">
                      {user?.role || "User"}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              >
                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-500 cursor-pointer"
                >
                  <FaSignOutAlt className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
