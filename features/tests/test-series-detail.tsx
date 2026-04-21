"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceBlock } from "@/components/shared/price-block";
import { EmptyState } from "@/components/shared/empty-state";
import { GradientOrb } from "@/components/brand/gradient-orb";
import { EnrollButton } from "@/features/discover/enroll-button";
import { useTestSeries, useTestsInSeries } from "@/hooks/useTestSeries";
import { stripHtml } from "@/lib/utils";

interface TestSeriesDetailProps {
  slug: string;
}

export function TestSeriesDetail({ slug }: TestSeriesDetailProps) {
  const seriesQuery = useTestSeries(slug);
  const series = seriesQuery.data;
  const testsQuery = useTestsInSeries(
    series?.isEnrolled || series?.isPurchased ? series?.id : undefined
  );

  if (seriesQuery.isLoading) return <DetailSkeleton />;
  if (seriesQuery.isError || !series) {
    return (
      <EmptyState
        icon={Trophy}
        title="Test series not found"
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/tests">Browse series</Link>
          </Button>
        }
      />
    );
  }

  const isFree = series.isFree || series.discountedPrice === 0;
  const isEnrolled = Boolean(series.isEnrolled || series.isPurchased);

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <Link
        href="/tests"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All tests
      </Link>

      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-brand p-6 text-white shadow-glow sm:p-10">
        <GradientOrb
          color="sky"
          size="xl"
          className="-top-20 -right-20 opacity-60"
        />
        <div className="relative grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-center">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {series.exam && (
                <Badge className="border-transparent bg-white/20 text-white">
                  {series.exam}
                </Badge>
              )}
              {isFree && <Badge variant="success">Free</Badge>}
              {isEnrolled && <Badge variant="success">Enrolled</Badge>}
            </div>
            <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {series.title}
            </h1>
            {stripHtml(series.description) && (
              <p className="max-w-2xl text-balance text-sm leading-relaxed text-white/85 sm:text-base">
                {stripHtml(series.description)}
              </p>
            )}
          </div>

          <Card className="bg-background/95 text-foreground shadow-soft backdrop-blur">
            <div className="space-y-5 p-6">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {isFree ? "Price" : "One-time payment"}
                </p>
                <PriceBlock
                  total={series.totalPrice}
                  discounted={series.discountedPrice}
                  discountPercentage={series.discountPercentage}
                  size="lg"
                  isFree={isFree}
                />
              </div>
              <EnrollButton
                kind="TEST_SERIES"
                id={series.id}
                name={series.title}
                isFree={isFree}
                isEnrolled={isEnrolled}
                className="w-full"
              />
              <ul className="space-y-2 text-sm text-muted-foreground">
                {series.durationDays && (
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-success" />
                    {series.durationDays} days access
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Full analytics & leaderboard
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Instant scoring & solutions
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Included tests
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEnrolled
                ? "Start any test below when you're ready."
                : "Enroll to unlock and attempt the tests."}
            </p>
          </div>
        </div>

        {!isEnrolled ? (
          <EmptyState
            icon={Trophy}
            title="Tests unlock after enrollment"
            description="Once enrolled you'll see every test in this series with your attempts & analytics."
            compact
          />
        ) : testsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : !testsQuery.data?.length ? (
          <EmptyState
            icon={FileText}
            title="No tests yet"
            description="Tests for this series will appear here as they are published."
            compact
          />
        ) : (
          <div className="space-y-3">
            {testsQuery.data.map((t) => (
              <Card
                key={t.id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-brand-soft text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold">
                    {t.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {t.duration} min
                    </span>
                    <span>{t.totalMarks} marks</span>
                    {t.passingMarks ? (
                      <span>Pass: {t.passingMarks}</span>
                    ) : null}
                    {t.hasAttempted && (
                      <Badge variant="success" className="text-[10px]">
                        {t.attemptCount}× attempted
                      </Badge>
                    )}
                    {t.isFree && (
                      <Badge variant="outline" className="text-[10px]">
                        Free
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    disabled={!t.isPublished}
                  >
                    <Link href={`/tests/${series.slug}/test/${t.slug || t.id}`}>
                      Preview
                    </Link>
                  </Button>
                  <Button
                    variant="gradient"
                    size="sm"
                    disabled={!t.isPublished}
                  >
                    <PlayCircle className="h-4 w-4" />
                    {t.hasAttempted ? "Attempt again" : "Start"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-72 w-full" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
