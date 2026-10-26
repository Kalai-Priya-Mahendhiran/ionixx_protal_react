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
  // True right after signing out in this tab, so the login screen doesn't remember the page they were on
  signedOut: boolean;
  // Refreshes the signed-in person's details (e.g. after they rename themselves in Profile)
  updateUser: (changes: Partial<Pick<User, "name" | "designation" | "department" | "avatar">>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/*
 * Each tab keeps its own session (sessionStorage), so people can be signed in as different users side by side.
 * The latest sign-in is also remembered here, so a link opened in a new tab (e.g. a shared task) starts signed in
 * as that person instead of showing the login screen. Signing in again in that tab still switches only that tab.
 */
const LAST_SESSION_KEY = "kpss.lastSession";

interface StoredSession {
  token: string;
  user: User;
}

function readLastSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(LAST_SESSION_KEY);
    const session = raw ? (JSON.parse(raw) as StoredSession) : null;
    return session?.token && session.user ? session : null;
  } catch {
    return null;
  }
}

function writeLastSession(session: StoredSession | null) {
  try {
    if (session) localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(LAST_SESSION_KEY);
  } catch {
    // Storage blocked (private mode): new tabs will ask to sign in, which is still safe
  }
}

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
  const [signedOut, setSignedOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const storage = new Storage();

  useEffect(() => {
    // Check for existing session on mount
    const storedToken = storage.getItem<string>("token");
    const storedUser = storage.getItem<User>("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    } else {
      // A fresh tab (e.g. a shared link) picks up the most recent sign-in on this browser
      const last = readLastSession();
      if (last) {
        storage.setItem("token", last.token);
        storage.setItem("user", last.user);
        storage.setItem("name", last.user.name);
        setToken(last.token);
        setUser(last.user);
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setSignedOut(false);
    storage.setItem("token", authToken);
    storage.setItem("user", userData);
    writeLastSession({ token: authToken, user: userData });
  };

  const updateUser = (changes: Partial<Pick<User, "name" | "designation" | "department" | "avatar">>) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...changes };
      storage.setItem("user", next);
      const last = readLastSession();
      if (last && last.user.id === next.id) writeLastSession({ ...last, user: next });
      return next;
    });
  };

  const logout = () => {
    // Signing out also stops new tabs from reusing this session (another tab's newer sign-in is left alone)
    if (readLastSession()?.token === token) writeLastSession(null);
    setUser(null);
    setToken(null);
    // Set in the same update as the sign-out, so ProtectedRoute sends them to /login without remembering this page
    // (otherwise the next sign-in, maybe by someone else, lands back on it instead of the Dashboard)
    setSignedOut(true);
    storage.clearStorage();
    toast.success("Logged out successfully!");
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    signedOut,
    updateUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
