import { AuthGuard } from "@/features/auth/auth-guard";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { MobileBottomNav } from "@/components/dashboard/mobile-nav";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="relative flex min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <DashboardSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <DashboardTopbar />
          <main className="flex-1 px-4 pb-24 pt-6 lg:px-8">{children}</main>
          <MobileBottomNav />
        </div>
      </div>
    </AuthGuard>
  );
}
