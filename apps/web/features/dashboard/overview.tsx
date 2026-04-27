"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, Flame, PlayCircle, Target } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { getWatchStats, getRecentlyWatched } from "@/services/contentProgressService";
import { listMyBatches } from "@/services/batchService";
import { listSchedules } from "@/services/scheduleService";
import { useAuthStore } from "@/store/authStore";
import { formatDuration } from "@/lib/utils";
import { GreetingBanner } from "./components/greeting-banner";
import { ContinueLearningCard } from "./components/continue-learning-card";
import { UpcomingLiveCard } from "./components/upcoming-live-card";
import { MyBatchesCard } from "./components/my-batches-card";

export function DashboardOverview() {
  const user = useAuthStore((s) => s.user);
  const firstName = (user?.username ?? "").split(" ")[0] || "there";

  const watchStats = useQuery({
    queryKey: ["watchStats"],
    queryFn: () => getWatchStats(),
  });

  const myBatches = useQuery({
    queryKey: ["myBatches", { page: 1, limit: 4 }],
    queryFn: () => listMyBatches({ page: 1, limit: 4 }),
  });

  const recent = useQuery({
    queryKey: ["recentlyWatched", { limit: 4 }],
    queryFn: () => getRecentlyWatched({ limit: 4 }),
  });

  const upcoming = useQuery({
    queryKey: ["upcomingSchedules"],
    queryFn: () => listSchedules({ upcoming: true, limit: 4 }),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <GreetingBanner userName={firstName} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Videos watched"
          value={watchStats.data?.totalVideosWatched ?? 0}
          sublabel={`${watchStats.data?.completedVideosCount ?? 0} completed`}
          icon={PlayCircle}
          tone="indigo"
          loading={watchStats.isLoading}
        />
        <StatCard
          label="Watch time"
          value={
            watchStats.data?.totalWatchTimeFormatted ??
            formatDuration(watchStats.data?.totalWatchTimeSeconds ?? 0)
          }
          sublabel="Total lifetime"
          icon={Clock}
          tone="violet"
          loading={watchStats.isLoading}
        />
        <StatCard
          label="Avg completion"
          value={`${Math.round(watchStats.data?.averageCompletionRate ?? 0)}%`}
          sublabel="Across watched videos"
          icon={Target}
          tone="emerald"
          loading={watchStats.isLoading}
        />
        <StatCard
          label="Current streak"
          value="0"
          sublabel="Start today!"
          icon={Flame}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <ContinueLearningCard
          items={recent.data?.items ?? []}
          isLoading={recent.isLoading}
        />
        <UpcomingLiveCard
          schedules={upcoming.data?.items ?? []}
          isLoading={upcoming.isLoading}
        />
      </div>

      <MyBatchesCard
        batches={myBatches.data?.items ?? []}
        isLoading={myBatches.isLoading}
      />
    </div>
  );
}
