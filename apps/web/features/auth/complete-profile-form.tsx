"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateProfile } from "@/hooks/useProfile";
import { useAuthStore } from "@/store/authStore";

const schema = z.object({
  username: z
    .string()
    .min(2, "At least 2 characters")
    .max(40, "Too long"),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  pincode: z
    .string()
    .max(10)
    .optional()
    .refine((v) => !v || /^\d{3,10}$/.test(v), "Invalid pincode"),
});

type FormValues = z.infer<typeof schema>;

export function CompleteProfileForm() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const update = useUpdateProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", gender: undefined },
  });

  React.useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/sign-in");
    else if (user.username) router.replace("/dashboard");
  }, [hydrated, user, router]);

  const onSubmit = form.handleSubmit(async (values) => {
    await update.mutateAsync(
      {
        username: values.username,
        gender: values.gender ?? null,
        address: {
          city: values.city ?? null,
          state: values.state ?? null,
          pincode: values.pincode ?? null,
        },
      },
      {
        onSuccess: () => router.replace("/dashboard"),
      }
    );
  });

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Tell us a <span className="gradient-text">little about you</span>
        </h1>
        <p className="text-muted-foreground">
          One quick step — we&apos;ll personalise your dashboard from here.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="username">Display name</Label>
          <Input
            id="username"
            placeholder="e.g. Aditi Sharma"
            autoComplete="name"
            {...form.register("username")}
          />
          {form.formState.errors.username && (
            <p className="text-xs text-destructive">
              {form.formState.errors.username.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender (optional)</Label>
          <select
            id="gender"
            defaultValue=""
            {...form.register("gender")}
            className="flex h-11 w-full rounded-xl border border-input bg-background/60 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <option value="">Prefer not to say</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="Bengaluru" {...form.register("city")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              placeholder="Karnataka"
              {...form.register("state")}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pincode">PIN code</Label>
          <Input
            id="pincode"
            placeholder="560001"
            inputMode="numeric"
            maxLength={10}
            {...form.register("pincode")}
          />
          {form.formState.errors.pincode && (
            <p className="text-xs text-destructive">
              {form.formState.errors.pincode.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="w-full"
          disabled={update.isPending}
        >
          {update.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              Continue to dashboard <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
