"use client";

import { Radio } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ScheduleCard } from "@/components/discover/schedule-card";

interface LiveClassesSectionProps {
  schedules: any[] | undefined;
  isLoading: boolean;
}

export function LiveClassesSection({
  schedules,
  isLoading,
}: LiveClassesSectionProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    );
  }
  if (!schedules?.length) {
    return (
      <EmptyState
        icon={Radio}
        title="No live classes yet"
        description="Upcoming sessions for this batch will appear here."
        compact
      />
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {schedules.map((s) => (
        <ScheduleCard key={s.id} schedule={s} />
      ))}
    </div>
  );
}
