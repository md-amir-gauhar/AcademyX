"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  useAuthStore,
  selectIsAuthenticated,
  selectNeedsProfile,
} from "@/store/authStore";

/**
 * Inverse of AuthGuard — keeps already-authenticated users out of the auth
 * pages. New users that still need to complete their profile are pinned to
 * /complete-profile; fully-authenticated users are bounced to ?next= (if
 * safe) or /dashboard.
 */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const needsProfile = useAuthStore(selectNeedsProfile);

  React.useEffect(() => {
    if (!hydrated || !isAuthenticated) return;

    if (needsProfile) {
      if (pathname !== "/complete-profile") {
        router.replace("/complete-profile");
      }
      return;
    }

    if (pathname === "/complete-profile") return;

    const raw =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next")
        : null;
    const next =
      raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
    router.replace(next);
  }, [hydrated, isAuthenticated, needsProfile, pathname, router]);

  // Suppress flicker while the redirect above resolves.
  if (hydrated && isAuthenticated) {
    if (needsProfile && pathname !== "/complete-profile") return null;
    if (!needsProfile && pathname !== "/complete-profile") return null;
  }

  return <>{children}</>;
}
