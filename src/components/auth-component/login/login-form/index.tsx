import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginSchema } from "@/lib/schemas";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLogin } from "@/services/apis/auth/useLogin";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/context/auth-context";
import { DEMO_ACCOUNTS, ROLE_LABELS } from "@/lib/mock-users";
import { Eye, EyeOff } from "lucide-react";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: login } = useLogin({
    onAuthenticated: authLogin,
    navigate,
    setLoading,
  });

  const redirectToDashboard = () => {
    try {
      navigate("/dashboard");
    } catch {
      window.location.href = "/dashboard";
    }
  };

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginId: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    setLoading(true);
    login(values, {
      onSuccess: () => {
        setTimeout(() => {
          redirectToDashboard();
        }, 1000);
      },
    });
  };

  const handleDemoFill = (loginId: string, password: string) => {
    form.setValue("loginId", loginId, { shouldValidate: true });
    form.setValue("password", password, { shouldValidate: true });
  };

  return (
    <div className="w-full space-y-6">
      <Form {...form}>
        <form
          data-testid="login-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* Login Id */}
          <FormField
            control={form.control}
            name="loginId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-medium">Login ID</FormLabel>
                <FormControl>
                   <Input
                     type="text"
                     className="w-full h-12 px-4 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3FCCE8] focus:border-transparent transition-all duration-200"
                     placeholder="Enter your login ID"
                     {...field}
                   />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="password-input" className="text-gray-700 font-medium">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      className="w-full h-12 px-4 pr-12 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3FCCE8] focus:border-transparent transition-all duration-200"
                      placeholder="Enter your password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-gray-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-ionixx-primary focus:ring-ionixx-primary border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-[#464EB8] text-sm font-bold">
                Remember me
              </label>
            </div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.ForgotPassword)}
              className="text-sm text-[#464EB8] hover:text-ionixx-primary font-bold transition-colors"
            >
              Forgot password?
            </button>
          </div>

           <Button
             data-testid="login-button"
             variant="ionixx"
             className="w-full h-12 font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] focus:ring-4 focus:ring-indigo-600/20 shadow-lg hover:shadow-xl"
             type="submit"
             disabled={loading}
           >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </Form>

      {/* Demo accounts (mock auth — backend not yet integrated) */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Demo accounts
        </p>
        <div className="flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={() => handleDemoFill(acc.loginId, acc.password)}
              className="px-3 py-1.5 text-xs font-medium rounded-full border border-[#464EB8]/30 text-[#464EB8] hover:bg-[#464EB8] hover:text-white transition-colors"
              title={`${acc.loginId} / ${acc.password}`}
            >
              {ROLE_LABELS[acc.role]}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          Click a chip to autofill credentials.
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
