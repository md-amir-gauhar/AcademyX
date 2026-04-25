import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPut } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Shield, Mail, CreditCard } from "lucide-react";
import type { OrganizationConfig } from "@/types";
import { ApiRequestError } from "@/lib/api/errors";

export function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["org-config"],
    queryFn: () => apiGet<OrganizationConfig>(endpoints.orgConfig.get),
  });

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiPut(endpoints.orgConfig.update, body),
    onSuccess: () => {
      toast.success("Settings updated");
      queryClient.invalidateQueries({ queryKey: ["org-config"] });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Update failed",
      ),
  });

  const maintenanceMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      apiPost(endpoints.orgConfig.maintenance, { enabled }),
    onSuccess: () => {
      toast.success("Maintenance mode toggled");
      queryClient.invalidateQueries({ queryKey: ["org-config"] });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed",
      ),
  });

  const handleGeneralSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      logoUrl: fd.get("logoUrl") || undefined,
      faviconUrl: fd.get("faviconUrl") || undefined,
      primaryColor: fd.get("primaryColor") || undefined,
      tagline: fd.get("tagline") || undefined,
      supportEmail: fd.get("supportEmail") || undefined,
      supportPhone: fd.get("supportPhone") || undefined,
      seoTitle: fd.get("seoTitle") || undefined,
      seoDescription: fd.get("seoDescription") || undefined,
    });
  };

  const handlePaymentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      razorpayKeyId: fd.get("razorpayKeyId") || undefined,
      razorpayKeySecret: fd.get("razorpayKeySecret") || undefined,
    });
  };

  const handleSmtpSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      smtpHost: fd.get("smtpHost") || undefined,
      smtpPort: Number(fd.get("smtpPort")) || undefined,
      smtpUser: fd.get("smtpUser") || undefined,
      smtpPassword: fd.get("smtpPassword") || undefined,
      smtpFromEmail: fd.get("smtpFromEmail") || undefined,
    });
  };

  const orgConfig = config && typeof config === "object" ? (config as OrganizationConfig) : null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Settings"
        description="Organization configuration"
        action={
          <div className="flex items-center gap-3">
            <Badge
              variant={orgConfig?.maintenanceMode ? "warning" : "success"}
            >
              {orgConfig?.maintenanceMode ? "Maintenance" : "Live"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                maintenanceMutation.mutate(!orgConfig?.maintenanceMode)
              }
            >
              {orgConfig?.maintenanceMode
                ? "Disable Maintenance"
                : "Enable Maintenance"}
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGeneralSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    name="logoUrl"
                    defaultValue={orgConfig?.logoUrl ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faviconUrl">Favicon URL</Label>
                  <Input
                    id="faviconUrl"
                    name="faviconUrl"
                    defaultValue={orgConfig?.faviconUrl ?? ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    name="tagline"
                    defaultValue={orgConfig?.tagline ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Input
                    id="primaryColor"
                    name="primaryColor"
                    defaultValue={orgConfig?.primaryColor ?? ""}
                    placeholder="#6366F1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    name="supportEmail"
                    defaultValue={orgConfig?.supportEmail ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <Input
                    id="supportPhone"
                    name="supportPhone"
                    defaultValue={orgConfig?.supportPhone ?? ""}
                  />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    name="seoTitle"
                    defaultValue={orgConfig?.seoTitle ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoDescription">SEO Description</Label>
                  <Input
                    id="seoDescription"
                    name="seoDescription"
                    defaultValue={orgConfig?.seoDescription ?? ""}
                  />
                </div>
              </div>
              <Button type="submit" disabled={updateMutation.isPending}>
                Save General Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              Payment (Razorpay)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="razorpayKeyId">Key ID</Label>
                  <Input
                    id="razorpayKeyId"
                    name="razorpayKeyId"
                    defaultValue={orgConfig?.razorpayKeyId ?? ""}
                    type="password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razorpayKeySecret">Key Secret</Label>
                  <Input
                    id="razorpayKeySecret"
                    name="razorpayKeySecret"
                    defaultValue={orgConfig?.razorpayKeySecret ?? ""}
                    type="password"
                  />
                </div>
              </div>
              <Button type="submit" disabled={updateMutation.isPending}>
                Save Payment Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" />
              SMTP / Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSmtpSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    name="smtpHost"
                    defaultValue={orgConfig?.smtpHost ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    name="smtpPort"
                    type="number"
                    defaultValue={orgConfig?.smtpPort ?? 587}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP User</Label>
                  <Input
                    id="smtpUser"
                    name="smtpUser"
                    defaultValue={orgConfig?.smtpUser ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    name="smtpPassword"
                    type="password"
                    defaultValue={orgConfig?.smtpPassword ?? ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpFromEmail">From Email</Label>
                <Input
                  id="smtpFromEmail"
                  name="smtpFromEmail"
                  defaultValue={orgConfig?.smtpFromEmail ?? ""}
                />
              </div>
              <Button type="submit" disabled={updateMutation.isPending}>
                Save SMTP Settings
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
