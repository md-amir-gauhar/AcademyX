"use client";

import * as React from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { TestSeriesCard } from "@/components/discover/test-series-card";
import { BatchCardSkeleton } from "@/components/discover/batch-card";
import { useMyTestSeries, useTestSeriesList } from "@/hooks/useTestSeries";
import { cn } from "@/lib/utils";

export function TestsMarketplace() {
  const [tab, setTab] = React.useState<"all" | "mine">("all");
  const [query, setQuery] = React.useState("");

  const all = useTestSeriesList({ page: 1, limit: 24 });
  const mine = useMyTestSeries({ page: 1, limit: 24 });

  const filterFor = React.useCallback(
    <T extends { title: string; description?: string | null }>(items: T[]): T[] => {
      const q = query.trim().toLowerCase();
      if (!q) return items;
      return items.filter((s) =>
        `${s.title} ${s.description ?? ""}`.toLowerCase().includes(q)
      );
    },
    [query]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Tests"
        title={
          <>
            Sharpen your prep with{" "}
            <span className="gradient-text">mock tests</span>
          </>
        }
        description="Simulated exams, full analytics and leaderboards — organized into focused series."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search test series…"
          className="sm:max-w-sm"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "mine")}>
        <TabsList>
          <TabsTrigger value="all">All series</TabsTrigger>
          <TabsTrigger value="mine">
            My series
            {mine.data?.items?.length ? (
              <Badge variant="secondary" className="ml-2">
                {mine.data.items.length}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {all.isLoading ? (
            <Grid>
              {Array.from({ length: 6 }).map((_, i) => (
                <BatchCardSkeleton key={i} />
              ))}
            </Grid>
          ) : !all.data?.items.length ? (
            <EmptyState
              icon={Trophy}
              title="No test series available yet"
              description="Your institute hasn't published test series. Come back soon!"
            />
          ) : (
            <Grid>
              {filterFor(all.data.items).map((s) => (
                <TestSeriesCard key={s.id} series={s} />
              ))}
            </Grid>
          )}
        </TabsContent>

        <TabsContent value="mine">
          {mine.isLoading ? (
            <Grid>
              {Array.from({ length: 3 }).map((_, i) => (
                <BatchCardSkeleton key={i} />
              ))}
            </Grid>
          ) : !mine.data?.items.length ? (
            <EmptyState
              icon={Trophy}
              title="No enrolled test series"
              description="Enroll in a series to unlock its mock tests and analytics."
              action={
                <Button asChild variant="gradient" size="sm">
                  <Link href="/tests">Explore series</Link>
                </Button>
              }
            />
          ) : (
            <Grid>
              {filterFor(mine.data.items).map((s) => (
                <TestSeriesCard key={s.id} series={s} />
              ))}
            </Grid>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Grid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mt-4 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}
