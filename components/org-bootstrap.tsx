"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchOrgConfig } from "@/services/orgService";
import { env } from "@/lib/env";
import { useOrgStore } from "@/store/orgStore";

/**
 * Fetches the public organization config on cold start so the rest of the app
 * can rely on organizationId (required for OTP auth) + branding/theme/flags.
 * Safe to render once at the root.
 */
export function OrgBootstrap() {
  const setConfig = useOrgStore((s) => s.setConfig);
  const setError = useOrgStore((s) => s.setError);

  const { data, error } = useQuery({
    queryKey: ["orgConfig", env.orgSlug],
    queryFn: () => fetchOrgConfig(env.orgSlug),
    staleTime: 15 * 60_000,
    retry: 1,
  });

  React.useEffect(() => {
    if (data) setConfig(data);
  }, [data, setConfig]);

  React.useEffect(() => {
    if (error) {
      const message =
        (error as { message?: string }).message ??
        "Failed to load organization config";
      setError(message);
    }
  }, [error, setError]);

  return null;
}
