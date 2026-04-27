import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPut } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrganizationConfig } from "@/types";
import { ApiRequestError } from "@/lib/api/errors";
import { GeneralSettingsForm } from "./components/general-settings-form";
import { PaymentSettingsForm } from "./components/payment-settings-form";
import { SmtpSettingsForm } from "./components/smtp-settings-form";

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

  const orgConfig =
    config && typeof config === "object"
      ? (config as OrganizationConfig)
      : null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" />
        {Array.from({ length: 3 }).map((_, i) => (
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
        <GeneralSettingsForm
          config={orgConfig}
          onSubmit={handleGeneralSubmit}
          isPending={updateMutation.isPending}
        />
        <PaymentSettingsForm
          config={orgConfig}
          onSubmit={handlePaymentSubmit}
          isPending={updateMutation.isPending}
        />
        <SmtpSettingsForm
          config={orgConfig}
          onSubmit={handleSmtpSubmit}
          isPending={updateMutation.isPending}
        />
      </div>
    </div>
  );
}
