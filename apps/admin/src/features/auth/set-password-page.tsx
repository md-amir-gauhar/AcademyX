import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiRequestError } from "@/lib/api/errors";
import { Lock } from "lucide-react";
import { AuthLayout } from "./components/auth-layout";

interface PasswordForm {
  password: string;
  confirmPassword: string;
}

export function SetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordForm>();

  const onSubmit = async (data: PasswordForm) => {
    if (!userId) {
      toast.error("Missing user ID");
      return;
    }
    setLoading(true);
    try {
      await apiPost(endpoints.auth.setPassword, {
        userId,
        password: data.password,
      });
      toast.success("Password set! You can now log in.");
      navigate("/login");
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Failed to set password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set your password"
      subtitle="Choose a strong password for your account"
      icon={
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
      }
      footer={
        <Link to="/login" className="text-primary hover:underline">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Min 8 characters"
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "Min 8 characters" },
            })}
          />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter password"
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (val) =>
                val === watch("password") || "Passwords don't match",
            })}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Setting password..." : "Set Password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
