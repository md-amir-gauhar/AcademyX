"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function LearningViewSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-10 w-60" />
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Skeleton className="h-60 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    </div>
  );
}
