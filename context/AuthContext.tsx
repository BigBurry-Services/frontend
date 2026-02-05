"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface User {
  userId: string;
  username: string;
  role: "admin" | "doctor" | "pharmacist" | "receptionist";
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: any) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for token in localStorage on mount
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // Set default auth header for axios
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = (token: string, userData: any) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Redirect based on role
    switch (userData.role) {
      case "admin":
      case "receptionist":
        router.push("/reception");
        break;
      case "doctor":
        router.push("/doctor");
        break;
      case "pharmacist":
        router.push("/pharmacy");
        break;
      default:
        router.push("/");
    }
  };

  const logout = async () => {
    try {
      if (user?.username) {
        await axios.post("/api/auth/logout", { username: user.username });
      }
    } catch (error) {
      console.error("Logout log failed", error);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-sky-600 animate-spin"></div>
          <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-t-2 border-b-2 border-sky-600/20"></div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
