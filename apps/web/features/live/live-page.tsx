"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ScheduleCard } from "@/components/discover/schedule-card";
import { useSchedules } from "@/hooks/useSchedules";
import type { ScheduleStatus } from "@/types/schedule";
import { cn } from "@/lib/utils";

type Tab = "upcoming" | "live" | "completed" | "all";

export function LivePage() {
  const [tab, setTab] = React.useState<Tab>("upcoming");

  const query = React.useMemo(() => {
    if (tab === "upcoming") return { upcoming: true, limit: 30 };
    if (tab === "live")
      return { status: "LIVE" as ScheduleStatus, limit: 30 };
    if (tab === "completed")
      return { status: "COMPLETED" as ScheduleStatus, limit: 30 };
    return { limit: 30 };
  }, [tab]);

  const schedules = useSchedules(query);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Live classes"
        title={
          <>
            Never miss a <span className="gradient-text">live session</span>
          </>
        }
        description="All scheduled sessions across your enrolled batches — join live, replay later."
        actions={
          <Button asChild variant="outline">
            <Link href="/my-batches">
              <Compass className="h-4 w-4" /> My batches
            </Link>
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="live">
            <span className={cn(
              "mr-1 h-1.5 w-1.5 rounded-full",
              schedules.data?.items?.some((s) => s.status === "LIVE")
                ? "bg-destructive animate-pulse"
                : "bg-muted-foreground/40"
            )} />
            Live now
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <ScheduleList
            loading={schedules.isLoading}
            items={schedules.data?.items ?? []}
            fallbackLabel={
              tab === "upcoming"
                ? "No upcoming classes"
                : tab === "live"
                  ? "No live classes right now"
                  : tab === "completed"
                    ? "No completed classes"
                    : "No classes yet"
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScheduleList({
  loading,
  items,
  fallbackLabel,
}: {
  loading: boolean;
  items: Array<React.ComponentProps<typeof ScheduleCard>["schedule"]>;
  fallbackLabel: string;
}) {
  if (loading) {
    return (
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full" />
        ))}
      </div>
    );
  }
  if (!items.length) {
    return (
      <EmptyState
        icon={Radio}
        title={fallbackLabel}
        description="Once your mentors publish schedules, they'll appear here."
        compact
        className="mt-4"
      />
    );
  }

  const live = items.filter((s) => s.status === "LIVE");
  const others = items.filter((s) => s.status !== "LIVE");

  return (
    <div className="mt-4 space-y-6">
      {live.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="live">Live now</Badge>
            <span className="text-xs text-muted-foreground">
              {live.length} session{live.length > 1 ? "s" : ""} on air
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((s) => (
              <ScheduleCard key={s.id} schedule={s} />
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((s) => (
          <ScheduleCard key={s.id} schedule={s} />
        ))}
      </div>
    </div>
  );
}
