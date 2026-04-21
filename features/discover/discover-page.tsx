"use client";

import * as React from "react";
import { Compass, Grid3X3, LayoutList, SlidersHorizontal, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import {
  BatchCard,
  BatchCardSkeleton,
} from "@/components/discover/batch-card";
import { TestSeriesCard } from "@/components/discover/test-series-card";
import { useBatches } from "@/hooks/useBatches";
import { useTestSeriesList } from "@/hooks/useTestSeries";
import type { Batch } from "@/types/batch";
import type { TestSeries } from "@/types/test";
import { cn } from "@/lib/utils";

type View = "grid" | "list";
type Tab = "batches" | "test-series";

export function DiscoverPage() {
  const [tab, setTab] = React.useState<Tab>("batches");
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<View>("grid");
  const [exam, setExam] = React.useState<string | null>(null);
  const [priceFilter, setPriceFilter] = React.useState<"all" | "free" | "paid">(
    "all"
  );

  const batchesQuery = useBatches({ page: 1, limit: 24 });
  const testSeriesQuery = useTestSeriesList({ page: 1, limit: 24 });

  const batches = React.useMemo(
    () =>
      applyFilters(batchesQuery.data?.items ?? [], {
        query,
        exam,
        priceFilter,
        getExam: (b) => b.exam ?? null,
        getTitle: (b) => `${b.name} ${b.description ?? ""}`,
        getPrice: (b) => b.discountedPrice,
      }),
    [batchesQuery.data, query, exam, priceFilter]
  );

  const series = React.useMemo(
    () =>
      applyFilters(testSeriesQuery.data?.items ?? [], {
        query,
        exam,
        priceFilter,
        getExam: (s) => s.exam ?? null,
        getTitle: (s) => `${s.title} ${s.description ?? ""}`,
        getPrice: (s) => s.discountedPrice,
      }),
    [testSeriesQuery.data, query, exam, priceFilter]
  );

  const availableExams = React.useMemo(() => {
    const all = new Set<string>();
    batchesQuery.data?.items?.forEach((b) => b.exam && all.add(b.exam));
    testSeriesQuery.data?.items?.forEach((s) => s.exam && all.add(s.exam));
    return Array.from(all).sort();
  }, [batchesQuery.data, testSeriesQuery.data]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Discover"
        title={
          <>
            Find your next{" "}
            <span className="gradient-text">learning adventure</span>
          </>
        }
        description="Curated batches and test series from top mentors — filter by exam, price and level."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search courses, mentors, exams…"
          className="lg:max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card p-1">
            {(["all", "free", "paid"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriceFilter(p)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                  priceFilter === p
                    ? "bg-gradient-brand text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card p-1">
            <Button
              size="icon"
              variant={view === "grid" ? "default" : "ghost"}
              aria-label="Grid view"
              onClick={() => setView("grid")}
              className="h-8 w-8"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={view === "list" ? "default" : "ghost"}
              aria-label="List view"
              onClick={() => setView("list")}
              className="h-8 w-8"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {availableExams.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Exam
          </span>
          <button
            onClick={() => setExam(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              exam === null
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          {availableExams.map((e) => (
            <button
              key={e}
              onClick={() => setExam(exam === e ? null : e)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                exam === e
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              )}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="batches">
            Batches
            {batches.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {batches.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="test-series">
            Test series
            {series.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {series.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batches">
          {batchesQuery.isLoading ? (
            <Grid view={view}>
              {Array.from({ length: 6 }).map((_, i) => (
                <BatchCardSkeleton key={i} />
              ))}
            </Grid>
          ) : batches.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="No batches match your filters"
              description="Try clearing filters or search terms to see everything we have."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setExam(null);
                    setPriceFilter("all");
                  }}
                >
                  Reset filters
                </Button>
              }
              className="mt-4"
            />
          ) : (
            <Grid view={view}>
              {batches.map((b) => (
                <BatchCard key={b.id} batch={b} />
              ))}
            </Grid>
          )}
        </TabsContent>

        <TabsContent value="test-series">
          {testSeriesQuery.isLoading ? (
            <Grid view={view}>
              {Array.from({ length: 6 }).map((_, i) => (
                <BatchCardSkeleton key={i} />
              ))}
            </Grid>
          ) : series.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No test series match your filters"
              description="Adjust filters or clear your search to see all available series."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setExam(null);
                    setPriceFilter("all");
                  }}
                >
                  Reset filters
                </Button>
              }
              className="mt-4"
            />
          ) : (
            <Grid view={view}>
              {series.map((s) => (
                <TestSeriesCard key={s.id} series={s} />
              ))}
            </Grid>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
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

interface FilterArgs<T> {
  query: string;
  exam: string | null;
  priceFilter: "all" | "free" | "paid";
  getExam: (item: T) => string | null;
  getTitle: (item: T) => string;
  getPrice: (item: T) => number;
}

function applyFilters<T>(items: T[], args: FilterArgs<T>) {
  const q = args.query.trim().toLowerCase();
  return items.filter((item) => {
    if (q) {
      const hay = args.getTitle(item).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (args.exam) {
      if (args.getExam(item) !== args.exam) return false;
    }
    if (args.priceFilter === "free" && args.getPrice(item) > 0) return false;
    if (args.priceFilter === "paid" && args.getPrice(item) === 0) return false;
    return true;
  });
}

// Type-safe re-exports so the generic works at compile time.
export type _batch = Batch;
export type _series = TestSeries;
