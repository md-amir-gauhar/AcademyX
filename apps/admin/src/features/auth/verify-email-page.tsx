import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiRequestError } from "@/lib/api/errors";
import { Mail } from "lucide-react";
import { AuthLayout } from "./components/auth-layout";

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";
  const [token, setToken] = useState(tokenFromUrl);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!token.trim()) {
      toast.error("Please enter the verification token");
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<{ userId: string }>(
        endpoints.auth.verifyEmail,
        { token },
      );
      if (res.data) {
        toast.success("Email verified! Set your password.");
        navigate(`/set-password?userId=${res.data.userId}`);
      }
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Verification failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the verification token sent to your email"
      icon={
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
      }
      footer={
        <Link to="/login" className="text-primary hover:underline">
          Back to login
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="token">Verification Token</Label>
          <Input
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token from email"
          />
        </div>
        <Button
          onClick={handleVerify}
          className="w-full"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify Email"}
        </Button>
      </div>
    </AuthLayout>
  );
}
