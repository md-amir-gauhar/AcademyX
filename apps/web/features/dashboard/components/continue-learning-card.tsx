"use client";

import Link from "next/link";
import { BookOpen, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";

interface RecentItem {
  content: {
    id: string;
    title: string;
    thumbnailUrl?: string | null;
    topic?: { name: string } | null;
  };
  progress: {
    watchPercentage: number;
  };
}

interface ContinueLearningCardProps {
  items: RecentItem[];
  isLoading: boolean;
}

export function ContinueLearningCard({
  items,
  isLoading,
}: ContinueLearningCardProps) {
  return (
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
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {!isLoading && !items.length && (
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

        {items.map((item) => (
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
  );
}
