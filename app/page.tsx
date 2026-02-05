"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect based on role if already logged in
        if (user.role === "admin" || user.role === "receptionist")
          router.push("/reception");
        else if (user.role === "doctor") router.push("/doctor");
        else if (user.role === "pharmacist") router.push("/pharmacy");
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-sky-600 animate-spin"></div>
        <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-t-2 border-b-2 border-sky-600/20"></div>
      </div>
    </div>
  );
}
