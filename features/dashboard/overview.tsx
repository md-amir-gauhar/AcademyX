"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Clock,
  Flame,
  PlayCircle,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { getWatchStats, getRecentlyWatched } from "@/services/contentProgressService";
import { listMyBatches } from "@/services/batchService";
import { listSchedules } from "@/services/scheduleService";
import { useAuthStore } from "@/store/authStore";
import { formatDuration, formatRelative } from "@/lib/utils";

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
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="mt-1 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome back,{" "}
            <span className="gradient-text">{firstName}</span> 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Let&apos;s keep the streak alive. Here&apos;s what&apos;s waiting for you today.
          </p>
        </div>
        <Button asChild variant="gradient" size="lg">
          <Link href="/discover">
            <Sparkles className="h-4 w-4" /> Explore new courses
          </Link>
        </Button>
      </div>

      {/* Stat grid */}
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
          value={`${Math.round(
            watchStats.data?.averageCompletionRate ?? 0
          )}%`}
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
        {/* Continue Learning */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Continue learning
              </h2>
              <p className="text-sm text-muted-foreground">
                Pick up right where you left off.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/my-batches">View all</Link>
            </Button>
          </div>

          <div className="space-y-3 p-6 pt-0">
            {recent.isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            )}

            {!recent.isLoading && !recent.data?.items.length && (
              <EmptyState
                icon={BookOpen}
                title="No videos yet"
                description="When you start watching lessons, they'll show up here so you can resume in a click."
                action={
                  <Button asChild variant="gradient" size="sm">
                    <Link href="/discover">Browse courses</Link>
                  </Button>
                }
              />
            )}

            {recent.data?.items.map((item) => (
              <div
                key={item.content.id}
                className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background/60 p-3 transition-colors hover:bg-muted/40"
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      item.content.thumbnailUrl ||
                      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&auto=format"
                    }
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                    <PlayCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {item.content.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.content.topic?.name ?? ""}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress
                      value={Math.round(item.progress.watchPercentage)}
                      className="h-1.5"
                    />
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {Math.round(item.progress.watchPercentage)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming live classes */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Upcoming live
              </h2>
              <p className="text-sm text-muted-foreground">
                Next sessions from your mentors.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/live">All</Link>
            </Button>
          </div>
          <div className="space-y-3 p-6 pt-0">
            {upcoming.isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            )}

            {!upcoming.isLoading && !upcoming.data?.items.length && (
              <EmptyState
                icon={Trophy}
                title="No upcoming classes"
                description="Once you enrol in a batch, your live classes will appear here."
                compact
              />
            )}

            {upcoming.data?.items.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-border/60 bg-background/60 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={s.status === "LIVE" ? "live" : "outline"}>
                    {s.status === "LIVE" ? "Live now" : s.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatRelative(s.scheduledAt)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-medium">
                  {s.title}
                </p>
                {s.teacher?.name && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.teacher.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* My Batches */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">My batches</h2>
            <p className="text-sm text-muted-foreground">
              Everything you&apos;ve enrolled in.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/my-batches">View all</Link>
          </Button>
        </div>
        <div className="grid gap-4 p-6 pt-0 sm:grid-cols-2 lg:grid-cols-4">
          {myBatches.isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}

          {!myBatches.isLoading && !myBatches.data?.items.length && (
            <div className="sm:col-span-2 lg:col-span-4">
              <EmptyState
                icon={BookOpen}
                title="No batches yet"
                description="Discover batches curated for your goals and enrol to start learning."
                action={
                  <Button asChild variant="gradient" size="sm">
                    <Link href="/discover">Explore batches</Link>
                  </Button>
                }
              />
            </div>
          )}

          {myBatches.data?.items.map((b) => (
            <div
              key={b.id}
              className="group overflow-hidden rounded-2xl border border-border/60 bg-background/60 transition-all hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="relative h-28 overflow-hidden bg-gradient-brand">
                {b.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover opacity-90"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="p-4">
                <p className="line-clamp-2 text-sm font-semibold">{b.name}</p>
                {b.teachers?.[0]?.name && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {b.teachers.map((t) => t.name).slice(0, 2).join(", ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 text-center ${
        compact ? "p-6" : "p-8"
      }`}
    >
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand-soft text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
