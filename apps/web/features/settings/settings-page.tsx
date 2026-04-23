"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, LogOut, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { useMyProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuthStore } from "@/store/authStore";
import { uploadAvatar } from "@/services/uploadService";
import { initials } from "@/lib/utils";
import { toast } from "sonner";
import type { Gender } from "@/types/auth";

const GENDERS: Array<Gender> = ["Male", "Female", "Other", "Prefer not to say"];

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

type FormValues = z.infer<typeof schema>;

export function SettingsPage() {
  const profileQuery = useMyProfile();
  const update = useUpdateProfile();
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const [uploading, setUploading] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      gender: undefined,
      phoneNumber: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  React.useEffect(() => {
    const p = profileQuery.data;
    if (!p) return;
    form.reset({
      username: p.username ?? "",
      gender: (p.gender ?? undefined) as Gender | undefined,
      phoneNumber: p.phoneNumber ?? "",
      city: p.address?.city ?? "",
      state: p.address?.state ?? "",
      pincode: p.address?.pincode ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileQuery.data]);

  const onSubmit = form.handleSubmit(async (values) => {
    await update.mutateAsync({
      username: values.username,
      gender: values.gender ?? null,
      phoneNumber: values.phoneNumber ? values.phoneNumber : null,
      address: {
        city: values.city || null,
        state: values.state || null,
        pincode: values.pincode || null,
      },
    });
  });

  const handleAvatarChange = async (file: File) => {
    try {
      setUploading(true);
      const uploaded = await uploadAvatar(file);
      await update.mutateAsync({ profileImg: uploaded.url });
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error(
        (err as { message?: string }).message || "Avatar upload failed"
      );
    } finally {
      setUploading(false);
    }
  };

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-16 w-1/2" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const profile = profileQuery.data;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Settings"
        title={
          <>
            Your <span className="gradient-text">account</span>
          </>
        }
        description="Update your profile, contact and account settings."
        actions={
          <Button variant="outline" onClick={() => logout()}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        }
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
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
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {uploading ? "Uploading…" : "Change photo"}
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarChange(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
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
                  onClick={() => {
                    if (profileQuery.data) {
                      const p = profileQuery.data;
                      form.reset({
                        username: p.username ?? "",
                        gender:
                          (p.gender ?? undefined) as Gender | undefined,
                        phoneNumber: p.phoneNumber ?? "",
                        city: p.address?.city ?? "",
                        state: p.address?.state ?? "",
                        pincode: p.address?.pincode ?? "",
                      });
                    }
                  }}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={update.isPending || !form.formState.isDirty}
                >
                  {update.isPending ? (
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
        </TabsContent>

        <TabsContent value="account">
          <Card className="space-y-5 p-6 sm:p-8">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Account details</h2>
              <p className="text-sm text-muted-foreground">
                Read-only information about your account.
              </p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="User ID" value={profile?.id} />
              <InfoRow label="Role" value={profile?.role} />
              <InfoRow
                label="Verified"
                value={
                  <Badge variant={profile?.isVerified ? "success" : "warning"}>
                    {profile?.isVerified ? "Verified" : "Unverified"}
                  </Badge>
                }
              />
              <InfoRow
                label="Mobile"
                value={`${profile?.countryCode ?? ""} ${profile?.phoneNumber ?? ""}`}
              />
              <InfoRow label="Email" value={profile?.email ?? "—"} />
              <InfoRow label="Organization" value={profile?.organizationId} />
              <InfoRow
                label="Created"
                value={
                  profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleString()
                    : "—"
                }
              />
            </dl>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}
