import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiRequestError } from "@/lib/api/errors";
import { AuthLayout } from "./components/auth-layout";

interface RegisterForm {
  organizationName: string;
  orgSlug: string;
  email: string;
  username: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const orgRes = await apiPost<{ id: string }>(
        endpoints.organizations.create,
        { name: data.organizationName, slug: data.orgSlug },
      );

      if (orgRes.data) {
        await apiPost(endpoints.auth.register, {
          organizationId: orgRes.data.id,
          email: data.email,
          username: data.username,
        });
        toast.success("Check your email for verification link");
        navigate("/verify-email");
      }
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="AcademyX"
      subtitle="Create your organization"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="organizationName">Organization Name</Label>
          <Input
            id="organizationName"
            placeholder="My Academy"
            {...register("organizationName", {
              required: "Organization name is required",
              minLength: { value: 3, message: "Min 3 characters" },
            })}
          />
          {errors.organizationName && (
            <p className="text-xs text-destructive">
              {errors.organizationName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="orgSlug">Organization Slug</Label>
          <Input
            id="orgSlug"
            placeholder="my-academy"
            {...register("orgSlug", {
              required: "Slug is required",
              pattern: {
                value: /^[a-z0-9-]+$/,
                message: "Lowercase, numbers, hyphens only",
              },
            })}
          />
          {errors.orgSlug && (
            <p className="text-xs text-destructive">
              {errors.orgSlug.message}
            </p>
          )}
        </div>
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
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="admin"
            {...register("username", { required: "Username is required" })}
          />
          {errors.username && (
            <p className="text-xs text-destructive">
              {errors.username.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create Organization"}
        </Button>
      </form>
    </AuthLayout>
  );
}
