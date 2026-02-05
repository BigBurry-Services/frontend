"use client";

import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import BedView from "@/components/BedView";

export default function ManageBeds() {
  const { user } = useAuth();

  if (!user || user.role !== "admin") {
    return <div className="p-10">Access Denied</div>;
  }

  return (
    <AppLayout>
      <main className="p-6">
        <BedView />
      </main>
    </AppLayout>
  );
}
