"use client";

import { Calendar, Clock, ExternalLink, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Schedule } from "@/types/schedule";

interface ScheduleCardProps {
  schedule: Schedule;
  className?: string;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ScheduleCard({ schedule, className }: ScheduleCardProps) {
  const isLive = schedule.status === "LIVE";
  const isCancelled = schedule.status === "CANCELLED";

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-soft",
        isLive && "ring-1 ring-destructive/40",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {isLive ? (
              <Badge variant="live" className="gap-1.5">
                <Radio className="h-3 w-3" />
                Live now
              </Badge>
            ) : isCancelled ? (
              <Badge variant="destructive">Cancelled</Badge>
            ) : schedule.status === "COMPLETED" ? (
              <Badge variant="outline">Ended</Badge>
            ) : (
              <Badge variant="default">Upcoming</Badge>
            )}
            {schedule.subject?.name && (
              <Badge variant="outline">{schedule.subject.name}</Badge>
            )}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
            {schedule.title}
          </h3>
          {schedule.teacher?.name && (
            <p className="text-xs text-muted-foreground">
              {schedule.teacher.name}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-y border-border/60 py-3 text-xs text-muted-foreground">
        <div className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {formatDateTime(schedule.scheduledAt)}
        </div>
        <div className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {schedule.duration} min
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        {schedule.batch?.name && (
          <span className="line-clamp-1 text-xs text-muted-foreground">
            {schedule.batch.name}
          </span>
        )}
        {schedule.youtubeLink && !isCancelled ? (
          <Button
            asChild
            variant={isLive ? "gradient" : "outline"}
            size="sm"
          >
            <a
              href={schedule.youtubeLink}
              target="_blank"
              rel="noreferrer"
            >
              {isLive ? "Join live" : "Open"}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        ) : null}
      </div>
    </article>
  );
}
