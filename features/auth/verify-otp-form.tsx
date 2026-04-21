"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OTPInput } from "@/components/ui/otp-input";
import { useRequestOtp, useVerifyOtp } from "@/hooks/useOtp";
import { useAuthStore, selectNeedsProfile } from "@/store/authStore";

const RESEND_SECONDS = 30;

export function VerifyOtpForm() {
  const router = useRouter();
  const pendingLogin = useAuthStore((s) => s.pendingLogin);
  const needsProfile = useAuthStore(selectNeedsProfile);

  const verify = useVerifyOtp();
  const resend = useRequestOtp();
  const [otp, setOtp] = React.useState("");
  const [seconds, setSeconds] = React.useState(RESEND_SECONDS);

  React.useEffect(() => {
    if (!pendingLogin) {
      router.replace("/sign-in");
    }
  }, [pendingLogin, router]);

  React.useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [seconds]);

  const handleSubmit = React.useCallback(
    async (code: string) => {
      if (!pendingLogin || code.length !== 6) return;
      await verify.mutateAsync(
        {
          countryCode: pendingLogin.countryCode,
          phoneNumber: pendingLogin.phoneNumber,
          organizationId: pendingLogin.organizationId,
          otp: code,
        },
        {
          onSuccess: () => {
            // decide where to send them:
            setTimeout(() => {
              if (useAuthStore.getState().user?.username) {
                router.replace("/dashboard");
              } else {
                router.replace("/complete-profile");
              }
            }, 0);
          },
          onError: () => setOtp(""),
        }
      );
    },
    [pendingLogin, verify, router]
  );

  const handleResend = async () => {
    if (!pendingLogin) return;
    await resend.mutateAsync({
      countryCode: pendingLogin.countryCode,
      phoneNumber: pendingLogin.phoneNumber,
      organizationId: pendingLogin.organizationId,
    });
    setSeconds(RESEND_SECONDS);
    setOtp("");
  };

  if (!pendingLogin) return null;
  // small workaround: when verify succeeds and user was existing, we want to
  // navigate; this also catches the case when the effect above hasn't run.
  if (verify.isSuccess && !needsProfile) {
    router.replace("/dashboard");
  }

  return (
    <div className="space-y-8">
      <Link
        href="/sign-in"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="space-y-2">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Enter the <span className="gradient-text">6-digit code</span>
        </h1>
        <p className="text-muted-foreground">
          Sent to{" "}
          <span className="font-medium text-foreground">
            {pendingLogin.countryCode} {pendingLogin.phoneNumber}
          </span>
          . {pendingLogin.isExistingUser ? "" : "You'll be signed up as a new learner."}
        </p>
      </div>

      <OTPInput
        value={otp}
        onChange={setOtp}
        length={6}
        autoFocus
        disabled={verify.isPending}
        onComplete={handleSubmit}
      />

      <Button
        type="button"
        variant="gradient"
        size="lg"
        className="w-full"
        disabled={otp.length !== 6 || verify.isPending}
        onClick={() => handleSubmit(otp)}
      >
        {verify.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
          </>
        ) : (
          "Verify & continue"
        )}
      </Button>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Didn&apos;t receive the code?{" "}
          {seconds > 0 ? (
            <span>Resend in {seconds}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resend.isPending}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {resend.isPending ? (
                <span className="inline-flex items-center gap-1">
                  <RotateCw className="h-3 w-3 animate-spin" /> Sending…
                </span>
              ) : (
                "Resend"
              )}
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
