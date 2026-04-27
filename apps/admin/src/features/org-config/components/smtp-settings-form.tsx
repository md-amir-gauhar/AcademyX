import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import type { OrganizationConfig } from "@/types";

interface SmtpSettingsFormProps {
  config: OrganizationConfig | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}

export function SmtpSettingsForm({
  config,
  onSubmit,
  isPending,
}: SmtpSettingsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" />
          SMTP / Email
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                name="smtpHost"
                defaultValue={config?.smtpHost ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                name="smtpPort"
                type="number"
                defaultValue={config?.smtpPort ?? 587}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpUser">SMTP User</Label>
              <Input
                id="smtpUser"
                name="smtpUser"
                defaultValue={config?.smtpUser ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <Input
                id="smtpPassword"
                name="smtpPassword"
                type="password"
                defaultValue={config?.smtpPassword ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpFromEmail">From Email</Label>
            <Input
              id="smtpFromEmail"
              name="smtpFromEmail"
              defaultValue={config?.smtpFromEmail ?? ""}
            />
          </div>
          <Button type="submit" disabled={isPending}>
            Save SMTP Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
