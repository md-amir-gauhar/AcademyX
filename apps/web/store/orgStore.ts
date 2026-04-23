"use client";

import { create } from "zustand";
import type { OrgConfig } from "@/types/org";

interface OrgState {
  config: OrgConfig | null;
  loading: boolean;
  error: string | null;
  setConfig: (config: OrgConfig) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  config: null,
  loading: true,
  error: null,
  setConfig: (config) => set({ config, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));

export const selectOrganizationId = (s: OrgState) =>
  s.config?.organizationId ?? null;
