"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore, selectIsAuthenticated, selectNeedsProfile } from "@/store/authStore";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const needsProfile = useAuthStore(selectNeedsProfile);

  React.useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (needsProfile && pathname !== "/complete-profile") {
      router.replace("/complete-profile");
    }
  }, [hydrated, isAuthenticated, needsProfile, pathname, router]);

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          Loading workspace…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (needsProfile && pathname !== "/complete-profile") return null;

  return <>{children}</>;
}
