import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap,
  Users,
  BookOpen,
  ClipboardList,
  Calendar,
  Database,
} from "lucide-react";
import type { Batch, Teacher, TestSeries, CacheStats } from "@/types";

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <p className="text-2xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const batchesQuery = useQuery({
    queryKey: ["batches"],
    queryFn: () =>
      apiGet<Batch[]>(endpoints.batches.list, {
        params: { page: 1, limit: 1 },
      }),
  });

  const teachersQuery = useQuery({
    queryKey: ["teachers"],
    queryFn: () => apiGet<Teacher[]>(endpoints.teachers.list),
  });

  const testSeriesQuery = useQuery({
    queryKey: ["test-series"],
    queryFn: () =>
      apiGet<TestSeries[]>(endpoints.testSeries.list, {
        params: { page: 1, limit: 1 },
      }),
  });

  const cacheQuery = useQuery({
    queryKey: ["cache-stats"],
    queryFn: () => apiGet<CacheStats>(endpoints.cache.stats),
  });

  const isLoading =
    batchesQuery.isLoading ||
    teachersQuery.isLoading ||
    testSeriesQuery.isLoading;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Overview of your academy"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Batches"
          value={Array.isArray(batchesQuery.data) ? batchesQuery.data.length : 0}
          icon={GraduationCap}
          loading={isLoading}
        />
        <StatCard
          title="Teachers"
          value={Array.isArray(teachersQuery.data) ? teachersQuery.data.length : 0}
          icon={Users}
          loading={isLoading}
        />
        <StatCard
          title="Test Series"
          value={Array.isArray(testSeriesQuery.data) ? testSeriesQuery.data.length : 0}
          icon={ClipboardList}
          loading={isLoading}
        />
        <StatCard
          title="Cache Keys"
          value={
            cacheQuery.data && typeof cacheQuery.data === "object" && "keyCount" in cacheQuery.data
              ? (cacheQuery.data as CacheStats).keyCount
              : "N/A"
          }
          icon={Database}
          loading={cacheQuery.isLoading}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "New Batch", href: "/batches", icon: GraduationCap },
                { label: "Add Teacher", href: "/teachers", icon: Users },
                { label: "Schedule Class", href: "/schedules", icon: Calendar },
                { label: "Create Test", href: "/test-series", icon: ClipboardList },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg border border-border/50 p-3 text-sm transition-colors hover:bg-accent"
                >
                  <item.icon className="h-4 w-4 text-primary" />
                  {item.label}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Cache Available
              </span>
              <span className="text-sm font-medium">
                {cacheQuery.data &&
                typeof cacheQuery.data === "object" &&
                "isAvailable" in cacheQuery.data
                  ? (cacheQuery.data as CacheStats).isAvailable
                    ? "Online"
                    : "Offline"
                  : "Unknown"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Memory Used
              </span>
              <span className="text-sm font-medium">
                {cacheQuery.data &&
                typeof cacheQuery.data === "object" &&
                "memoryUsed" in cacheQuery.data
                  ? (cacheQuery.data as CacheStats).memoryUsed
                  : "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
