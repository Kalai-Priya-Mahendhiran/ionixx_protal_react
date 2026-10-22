import React, { createContext, useContext, useEffect, useState } from "react";
import Storage from "@/services/storage/storage";
import { toast } from "sonner";
import type { UserRole } from "@/lib/mock-users";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  employeeId: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  // Refreshes the signed-in person's details (e.g. after they rename themselves in Profile)
  updateUser: (changes: Partial<Pick<User, "name" | "designation" | "department" | "avatar">>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const storage = new Storage();

  useEffect(() => {
    // Check for existing session on mount
    const storedToken = storage.getItem<string>("token");
    const storedUser = storage.getItem<User>("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    storage.setItem("token", authToken);
    storage.setItem("user", userData);
  };

  const updateUser = (changes: Partial<Pick<User, "name" | "designation" | "department" | "avatar">>) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...changes };
      storage.setItem("user", next);
      return next;
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    storage.clearStorage();
    toast.success("Logged out successfully!");
    // ProtectedRoute observes isAuthenticated and will redirect to /login.
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    updateUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
