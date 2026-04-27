import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/shared/page-header";
import { GraduationCap, Users, ClipboardList, Database } from "lucide-react";
import type { Batch, Teacher, TestSeries, CacheStats } from "@/types";
import { StatCard } from "./components/stat-card";
import { QuickActions } from "./components/quick-actions";
import { SystemStatus } from "./components/system-status";

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
        <QuickActions />
        <SystemStatus
          cacheData={cacheQuery.data}
          isLoading={cacheQuery.isLoading}
        />
      </div>
    </div>
  );
}
