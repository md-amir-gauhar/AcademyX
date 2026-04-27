"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { GENDERS, type Gender } from "@academyx/shared";
import type { UserProfile } from "@/types/profile";

const schema = z.object({
  username: z.string().min(2, "At least 2 characters").max(40, "Too long"),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]).optional(),
  phoneNumber: z
    .string()
    .regex(/^\d{10,15}$/, "Digits only")
    .optional()
    .or(z.literal("")),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  pincode: z
    .string()
    .max(10)
    .optional()
    .refine((v) => !v || /^\d{3,10}$/.test(v), "Invalid PIN"),
});

export type ProfileFormValues = z.infer<typeof schema>;

interface ProfileFormProps {
  profile: UserProfile | undefined;
  onSubmit: (values: ProfileFormValues) => void | Promise<void>;
  isPending: boolean;
  onAvatarUpload: (file: File) => void;
  isUploading: boolean;
}

function profileToDefaults(p: UserProfile | undefined): ProfileFormValues {
  return {
    username: p?.username ?? "",
    gender: (p?.gender ?? undefined) as Gender | undefined,
    phoneNumber: p?.phoneNumber ?? "",
    city: p?.address?.city ?? "",
    state: p?.address?.state ?? "",
    pincode: p?.address?.pincode ?? "",
  };
}

export function ProfileForm({
  profile,
  onSubmit,
  isPending,
  onAvatarUpload,
  isUploading,
}: ProfileFormProps) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: profileToDefaults(profile),
  });

  React.useEffect(() => {
    if (profile) form.reset(profileToDefaults(profile));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  return (
    <Card className="space-y-6 p-6 sm:p-8">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <Avatar className="h-20 w-20">
          {profile?.profileImg && (
            <AvatarImage src={profile.profileImg} alt={profile.username ?? ""} />
          )}
          <AvatarFallback className="text-lg">
            {initials(profile?.username)}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <div>
            <p className="text-sm font-semibold">
              {profile?.username ?? "Unnamed learner"}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile?.countryCode} {profile?.phoneNumber}
            </p>
          </div>
          <label
            htmlFor="avatar"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {isUploading ? "Uploading…" : "Change photo"}
            <input
              id="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onAvatarUpload(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="username">Display name</Label>
            <Input id="username" {...form.register("username")} />
            {form.formState.errors.username && (
              <p className="text-xs text-destructive">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              {...form.register("gender")}
              className="flex h-11 w-full rounded-xl border border-input bg-background/60 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <option value="">Prefer not to say</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone number</Label>
          <Input
            id="phoneNumber"
            inputMode="numeric"
            {...form.register("phoneNumber")}
          />
          {form.formState.errors.phoneNumber && (
            <p className="text-xs text-destructive">
              {form.formState.errors.phoneNumber.message}
            </p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...form.register("city")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" {...form.register("state")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pincode">PIN code</Label>
            <Input id="pincode" {...form.register("pincode")} />
            {form.formState.errors.pincode && (
              <p className="text-xs text-destructive">
                {form.formState.errors.pincode.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => form.reset(profileToDefaults(profile))}
          >
            Reset
          </Button>
          <Button
            type="submit"
            variant="gradient"
            disabled={isPending || !form.formState.isDirty}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
