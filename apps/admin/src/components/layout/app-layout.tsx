import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore, selectIsAuthenticated } from "@/store/auth-store";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [collapsed, setCollapsed] = useState(false);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "ml-[68px]" : "ml-[240px]",
        )}
      >
        <Topbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
