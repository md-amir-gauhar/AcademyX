"use client";

import { useOrgStore, selectOrganizationId } from "@/store/orgStore";

export function useOrgConfig() {
  const config = useOrgStore((s) => s.config);
  const loading = useOrgStore((s) => s.loading);
  const error = useOrgStore((s) => s.error);
  const organizationId = useOrgStore(selectOrganizationId);
  return { config, loading, error, organizationId };
}
