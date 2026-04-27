"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { useMyProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuthStore } from "@/store/authStore";
import { uploadAvatar } from "@/services/uploadService";
import { toast } from "sonner";
import { ProfileForm, type ProfileFormValues } from "./components/profile-form";
import { AccountInfo } from "./components/account-info";

export function SettingsPage() {
  const profileQuery = useMyProfile();
  const update = useUpdateProfile();
  const logout = useAuthStore((s) => s.logout);
  const [uploading, setUploading] = React.useState(false);

  const onSubmit = async (values: ProfileFormValues) => {
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
  };

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
          <ProfileForm
            profile={profile}
            onSubmit={onSubmit}
            isPending={update.isPending}
            onAvatarUpload={handleAvatarChange}
            isUploading={uploading}
          />
        </TabsContent>

        <TabsContent value="account">
          <AccountInfo profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
