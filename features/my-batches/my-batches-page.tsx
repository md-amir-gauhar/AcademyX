"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { BatchCard, BatchCardSkeleton } from "@/components/discover/batch-card";
import { SearchInput } from "@/components/shared/search-input";
import { useMyBatches } from "@/hooks/useBatches";

export function MyBatchesPage() {
  const [query, setQuery] = React.useState("");
  const batches = useMyBatches({ page: 1, limit: 50 });

  const filtered = React.useMemo(() => {
    const items = batches.data?.items ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((b) =>
      `${b.name} ${b.description ?? ""}`.toLowerCase().includes(q)
    );
  }, [batches.data, query]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="My batches"
        title={
          <>
            Your <span className="gradient-text">enrolled</span> courses
          </>
        }
        description="Everything you've joined — with quick links into the curriculum and live schedule."
        actions={
          <Button asChild variant="outline">
            <Link href="/discover">
              <Compass className="h-4 w-4" /> Discover more
            </Link>
          </Button>
        }
      />

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search your batches…"
        className="max-w-sm"
      />

      {batches.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <BatchCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No enrolled batches yet"
          description="Discover curated batches from top mentors and enroll to start learning."
          action={
            <Button asChild variant="gradient">
              <Link href="/discover">Explore batches</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <BatchCard
              key={b.id}
              batch={b}
              href={`/my-batches/${b.slug}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
