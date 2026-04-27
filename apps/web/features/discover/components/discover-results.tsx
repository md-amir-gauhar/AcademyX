"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { BatchCardSkeleton } from "@/components/discover/batch-card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type View = "grid" | "list";

interface DiscoverResultsProps<T extends { id: string }> {
  items: T[];
  isLoading: boolean;
  view: View;
  renderCard: (item: T) => React.ReactNode;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  onReset: () => void;
}

export function DiscoverResults<T extends { id: string }>({
  items,
  isLoading,
  view,
  renderCard,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  onReset,
}: DiscoverResultsProps<T>) {
  if (isLoading) {
    return (
      <Grid view={view}>
        {Array.from({ length: 6 }).map((_, i) => (
          <BatchCardSkeleton key={i} />
        ))}
      </Grid>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={
          <Button variant="outline" size="sm" onClick={onReset}>
            Reset filters
          </Button>
        }
        className="mt-4"
      />
    );
  }

  return <Grid view={view}>{items.map((item) => renderCard(item))}</Grid>;
}

function Grid({ view, children }: { view: View; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "mt-4 grid gap-5",
        view === "grid"
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1"
      )}
    >
      {children}
    </div>
  );
}
