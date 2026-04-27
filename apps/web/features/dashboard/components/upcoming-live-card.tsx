"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelative } from "@/lib/utils";

interface Schedule {
  id: string;
  title: string;
  status: string;
  scheduledAt: string;
  teacher?: { name: string } | null;
}

interface UpcomingLiveCardProps {
  schedules: Schedule[];
  isLoading: boolean;
}

export function UpcomingLiveCard({
  schedules,
  isLoading,
}: UpcomingLiveCardProps) {
  return (
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
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {!isLoading && !schedules.length && (
          <EmptyState
            icon={Trophy}
            title="No upcoming classes"
            description="Once you enrol in a batch, your live classes will appear here."
            compact
          />
        )}

        {schedules.map((s) => (
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
            <p className="mt-2 line-clamp-2 text-sm font-medium">{s.title}</p>
            {s.teacher?.name && (
              <p className="mt-1 text-xs text-muted-foreground">
                {s.teacher.name}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
