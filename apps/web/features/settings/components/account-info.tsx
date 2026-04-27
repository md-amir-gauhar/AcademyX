"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UserProfile } from "@/types/profile";

interface AccountInfoProps {
  profile: UserProfile | undefined;
}

export function AccountInfo({ profile }: AccountInfoProps) {
  return (
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
