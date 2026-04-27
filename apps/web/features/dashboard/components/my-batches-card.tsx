"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";

interface Batch {
  id: string;
  slug: string;
  name: string;
  thumbnailUrl?: string | null;
  teachers?: { name: string }[];
}

interface MyBatchesCardProps {
  batches: Batch[];
  isLoading: boolean;
}

export function MyBatchesCard({ batches, isLoading }: MyBatchesCardProps) {
  return (
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
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}

        {!isLoading && !batches.length && (
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

        {batches.map((b) => (
          <Link
            key={b.id}
            href={`/my-batches/${b.slug}`}
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
          </Link>
        ))}
      </div>
    </Card>
  );
}
