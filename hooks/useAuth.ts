"use client";

import { useAuthStore, selectIsAuthenticated, selectNeedsProfile } from "@/store/authStore";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const needsProfile = useAuthStore(selectNeedsProfile);

  return {
    user,
    accessToken,
    hydrated,
    isAuthenticated,
    needsProfile,
    logout,
  };
}
