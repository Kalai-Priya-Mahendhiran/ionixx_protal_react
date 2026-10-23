import { useMutation } from "@tanstack/react-query";
import type { NavigateFunction } from "react-router-dom";
import Storage from "../../storage/storage";
import { toast } from "sonner";
import { validateCredentials, type UserRole } from "@/lib/mock-users";
import { getAccessRecord, setAccessRecord } from "@/lib/user-access-store";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  employeeId: string;
  avatar?: string;
}

interface UseLoginProps {
  onAuthenticated: (user: AuthUser, token: string) => void;
  navigate: NavigateFunction;
  setLoading: (loading: boolean) => void;
  // Where to go after signing in (the page that sent them to login), the dashboard by default
  redirectTo?: string;
}

export const useLogin = ({ onAuthenticated, navigate, setLoading, redirectTo = "/dashboard" }: UseLoginProps) => {
  const storage = new Storage();

  return useMutation({
    mutationFn: async (data: { loginId: string; password: string }) => {
      if (!data.loginId || !data.password) {
        throw new Error("Please enter both login ID and password");
      }

      await new Promise((resolve) => setTimeout(resolve, 600));

      const matched = validateCredentials(data.loginId, data.password);
      if (!matched) {
        throw new Error("Invalid login ID or password");
      }
      // The backend must refuse deactivated accounts too
      if (getAccessRecord(matched.id).status === "deactivated") {
        throw new Error("This account has been deactivated. Contact your System Administrator.");
      }
      // First sign-in completes an invitation; every sign-in shows in User Management
      setAccessRecord(matched.id, { ...getAccessRecord(matched.id), status: "active", lastSignInAt: new Date().toISOString() });

      return {
        data: {
          token: "mock-jwt-token-" + Date.now(),
          id: matched.id,
          name: matched.name,
          email: matched.email,
          role: matched.role,
          department: matched.department,
          designation: matched.designation,
          employeeId: matched.employeeId,
          avatar: matched.avatar,
        },
      };
    },
    onSuccess: (response) => {
      const { token, ...rest } = response.data;
      const user: AuthUser = {
        id: rest.id,
        name: rest.name,
        email: rest.email,
        role: rest.role,
        department: rest.department,
        designation: rest.designation,
        employeeId: rest.employeeId,
        avatar: rest.avatar,
      };

      storage.setItem("name", user.name);
      onAuthenticated(user, token);

      toast.success(`Welcome ${user.name}! Redirecting...`);
      navigate(redirectTo, { replace: true });
    },
    onError: (error: any) => {
      setLoading(false);
      const errorMessage =
        error.message || error.response?.data?.message || "Login failed. Please try again.";
      toast.error(errorMessage);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};
