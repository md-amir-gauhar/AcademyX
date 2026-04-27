import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthResponse } from "@/types/auth";
import { ApiRequestError } from "@/lib/api/errors";
import { AuthLayout } from "./components/auth-layout";

interface LoginForm {
  email: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await apiPost<AuthResponse>(endpoints.auth.login, data);
      if (res.data) {
        setSession({ user: res.data.user, token: res.data.token });
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="AcademyX"
      subtitle="Sign in to the admin panel"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Register
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@example.com"
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <p className="text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            {...register("password", { required: "Password is required" })}
          />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
