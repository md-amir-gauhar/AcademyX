import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import type { OrganizationConfig } from "@/types";

interface PaymentSettingsFormProps {
  config: OrganizationConfig | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}

export function PaymentSettingsForm({
  config,
  onSubmit,
  isPending,
}: PaymentSettingsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4" />
          Payment (Razorpay)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="razorpayKeyId">Key ID</Label>
              <Input
                id="razorpayKeyId"
                name="razorpayKeyId"
                defaultValue={config?.razorpayKeyId ?? ""}
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="razorpayKeySecret">Key Secret</Label>
              <Input
                id="razorpayKeySecret"
                name="razorpayKeySecret"
                defaultValue={config?.razorpayKeySecret ?? ""}
                type="password"
              />
            </div>
          </div>
          <Button type="submit" disabled={isPending}>
            Save Payment Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
