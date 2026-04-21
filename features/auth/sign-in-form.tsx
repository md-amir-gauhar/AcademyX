"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequestOtp } from "@/hooks/useOtp";
import { useOrgConfig } from "@/hooks/useOrgConfig";
import { cn } from "@/lib/utils";

const schema = z.object({
  countryCode: z
    .string()
    .min(2, "Required")
    .max(5, "Too long")
    .regex(/^\+?\d+$/, "Digits only"),
  phoneNumber: z
    .string()
    .min(10, "Enter a valid 10-digit phone number")
    .max(15, "Too long")
    .regex(/^\d+$/, "Digits only"),
});

type FormValues = z.infer<typeof schema>;

export function SignInForm() {
  const router = useRouter();
  const { organizationId, loading: orgLoading, error: orgError } = useOrgConfig();
  const requestOtp = useRequestOtp();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { countryCode: "+91", phoneNumber: "" },
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!organizationId) return;
    await requestOtp.mutateAsync(
      { ...values, organizationId },
      {
        onSuccess: () => router.push("/verify-otp"),
      }
    );
  });

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-brand" />
          Sign in / Sign up
        </div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome to your{" "}
          <span className="gradient-text">learning space</span>
        </h1>
        <p className="text-muted-foreground">
          We&apos;ll send a one-time code to your mobile. No password needed.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Mobile number</Label>
          <div className="flex gap-2">
            <Input
              aria-label="Country code"
              className="w-20"
              maxLength={5}
              {...form.register("countryCode")}
            />
            <div className="relative flex-1">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phoneNumber"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="98765 43210"
                className="pl-10"
                {...form.register("phoneNumber")}
              />
            </div>
          </div>
          <div
            className={cn(
              "min-h-[1rem] text-xs",
              form.formState.errors.phoneNumber ||
                form.formState.errors.countryCode
                ? "text-destructive"
                : "text-muted-foreground"
            )}
          >
            {form.formState.errors.phoneNumber?.message ||
              form.formState.errors.countryCode?.message ||
              "We'll only use this to sign you in securely."}
          </div>
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="w-full"
          disabled={
            requestOtp.isPending || orgLoading || !organizationId
          }
        >
          {requestOtp.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending OTP…
            </>
          ) : (
            <>
              Send OTP <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        {orgError && (
          <p className="text-xs text-destructive">
            Could not load workspace config — {orgError}
          </p>
        )}
      </form>

      <div className="space-y-4">
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link href="#" className="underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
