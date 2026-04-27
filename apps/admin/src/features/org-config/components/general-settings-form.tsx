import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings } from "lucide-react";
import type { OrganizationConfig } from "@/types";

interface GeneralSettingsFormProps {
  config: OrganizationConfig | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}

export function GeneralSettingsForm({
  config,
  onSubmit,
  isPending,
}: GeneralSettingsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-4 w-4" />
          General
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                name="logoUrl"
                defaultValue={config?.logoUrl ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faviconUrl">Favicon URL</Label>
              <Input
                id="faviconUrl"
                name="faviconUrl"
                defaultValue={config?.faviconUrl ?? ""}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                name="tagline"
                defaultValue={config?.tagline ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <Input
                id="primaryColor"
                name="primaryColor"
                defaultValue={config?.primaryColor ?? ""}
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
                defaultValue={config?.supportEmail ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportPhone">Support Phone</Label>
              <Input
                id="supportPhone"
                name="supportPhone"
                defaultValue={config?.supportPhone ?? ""}
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
                defaultValue={config?.seoTitle ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO Description</Label>
              <Input
                id="seoDescription"
                name="seoDescription"
                defaultValue={config?.seoDescription ?? ""}
              />
            </div>
          </div>
          <Button type="submit" disabled={isPending}>
            Save General Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
