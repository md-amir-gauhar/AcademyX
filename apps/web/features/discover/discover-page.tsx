"use client";

import * as React from "react";
import { Compass, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { BatchCard } from "@/components/discover/batch-card";
import { TestSeriesCard } from "@/components/discover/test-series-card";
import { useBatches } from "@/hooks/useBatches";
import { useTestSeriesList } from "@/hooks/useTestSeries";
import { applyFilters } from "./discover-filters";
import { DiscoverToolbar } from "./components/discover-toolbar";
import { ExamFilter } from "./components/exam-filter";
import { DiscoverResults } from "./components/discover-results";

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

  const resetFilters = () => {
    setQuery("");
    setExam(null);
    setPriceFilter("all");
  };

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

      <DiscoverToolbar
        query={query}
        priceFilter={priceFilter}
        view={view}
        onQueryChange={setQuery}
        onPriceChange={setPriceFilter}
        onViewChange={setView}
      />

      <ExamFilter
        exams={availableExams}
        selected={exam}
        onExamChange={setExam}
      />

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
          <DiscoverResults
            items={batches}
            isLoading={batchesQuery.isLoading}
            view={view}
            renderCard={(b) => <BatchCard key={b.id} batch={b} />}
            emptyIcon={Compass}
            emptyTitle="No batches match your filters"
            emptyDescription="Try clearing filters or search terms to see everything we have."
            onReset={resetFilters}
          />
        </TabsContent>

        <TabsContent value="test-series">
          <DiscoverResults
            items={series}
            isLoading={testSeriesQuery.isLoading}
            view={view}
            renderCard={(s) => <TestSeriesCard key={s.id} series={s} />}
            emptyIcon={Trophy}
            emptyTitle="No test series match your filters"
            emptyDescription="Adjust filters or clear your search to see all available series."
            onReset={resetFilters}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
