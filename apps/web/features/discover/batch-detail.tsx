"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceBlock } from "@/components/shared/price-block";
import { TeacherRow } from "@/components/shared/teacher-row";
import { EmptyState } from "@/components/shared/empty-state";
import { GradientOrb } from "@/components/brand/gradient-orb";
import { ProductHero } from "@/components/shared/product-hero";
import { ScheduleCard } from "@/components/discover/schedule-card";
import { useBatch } from "@/hooks/useBatches";
import { useSubjects } from "@/hooks/useCourse";
import { useSchedulesByBatch } from "@/hooks/useSchedules";
import { EnrollButton } from "@/features/discover/enroll-button";
import { HtmlContent } from "@/components/shared/html-content";
import { formatNumber } from "@/lib/utils";

interface BatchDetailProps {
  slug: string;
}

export function BatchDetail({ slug }: BatchDetailProps) {
  const batchQuery = useBatch(slug);
  const batch = batchQuery.data;
  const subjectsQuery = useSubjects(batch?.id);
  const schedulesQuery = useSchedulesByBatch(
    batch?.isPurchased ? batch.id : undefined
  );

  if (batchQuery.isLoading) return <BatchDetailSkeleton />;

  if (batchQuery.isError || !batch) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Batch not found"
        description="This batch may have been removed or is no longer active."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/discover">Browse batches</Link>
          </Button>
        }
      />
    );
  }

  const isFree = batch.totalPrice === 0 || batch.discountedPrice === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <Link
        href="/discover"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Discover
      </Link>

      <ProductHero
        title={batch.name}
        description={
          batch.description ? (
            <HtmlContent
              html={batch.description}
              variant="prose"
              className="max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base"
            />
          ) : undefined
        }
        badges={
          <>
            {batch.exam && (
              <Badge className="border-transparent bg-white/20 text-white">
                {batch.exam}
              </Badge>
            )}
            {batch.class && (
              <Badge className="border-transparent bg-white/15 text-white">
                Class {batch.class}
              </Badge>
            )}
            {batch.language && (
              <Badge className="border-transparent bg-white/15 text-white">
                {batch.language}
              </Badge>
            )}
            {isFree && <Badge variant="success">Free</Badge>}
            {batch.isPurchased && <Badge variant="success">Enrolled</Badge>}
          </>
        }
        teacher={
          batch.teachers?.length > 0 ? (
            <TeacherRow teachers={batch.teachers} max={4} size="md" />
          ) : undefined
        }
        priceBlock={
          <>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isFree ? "Price" : "One-time payment"}
              </p>
              <PriceBlock
                total={batch.totalPrice}
                discounted={batch.discountedPrice}
                discountPercentage={batch.discountPercentage}
                size="lg"
                isFree={isFree}
              />
            </div>
            <EnrollButton
              kind="BATCH"
              id={batch.id}
              name={batch.name}
              isFree={isFree}
              isEnrolled={Boolean(batch.isPurchased)}
              goToOnEnrolled={`/my-batches/${batch.slug}`}
              className="w-full"
            />
          </>
        }
        features={[
          ...(batch.validity?.days
            ? [
                {
                  icon: <ShieldCheck className="h-4 w-4 text-success" />,
                  label: `Access for ${batch.validity.days} days`,
                },
              ]
            : []),
          {
            icon: <Sparkles className="h-4 w-4 text-primary" />,
            label: "Live mentor classes + recordings",
          },
          {
            icon: <CheckCircle2 className="h-4 w-4 text-success" />,
            label: "Certificate on completion",
          },
        ]}
      />

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={Layers} label="Subjects" value={subjectsQuery.data?.length ?? "—"} tone="indigo" />
        <Stat
          icon={BookOpen}
          label="Lessons"
          value={batch.lessonsCount ?? "—"}
          tone="violet"
        />
        <Stat
          icon={Users}
          label="Enrolled"
          value={
            batch.studentsCount != null ? formatNumber(batch.studentsCount) : "—"
          }
          tone="emerald"
        />
        <Stat
          icon={Clock}
          label="Duration"
          value={batch.durationHours != null ? `${batch.durationHours}h` : "—"}
          tone="amber"
        />
      </section>

      {/* Curriculum */}
      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              What you&apos;ll learn
            </h2>
            <p className="text-sm text-muted-foreground">
              Structured as subjects → chapters → topics → lessons.
            </p>
          </div>
        </div>
        {subjectsQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : subjectsQuery.data?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjectsQuery.data.map((s) => (
              <Card
                key={s.id}
                className="flex items-start gap-3 p-4"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-brand-soft text-primary">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-semibold">
                    {s.name}
                  </p>
                  {s.description && (
                    <HtmlContent
                      html={s.description}
                      variant="clamp"
                      className="mt-0.5 line-clamp-2 text-xs text-muted-foreground"
                    />
                  )}
                  {s.teachers && s.teachers.length > 0 && (
                    <div className="mt-2">
                      <TeacherRow teachers={s.teachers} max={3} />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Layers}
            title="Curriculum coming soon"
            description="Subjects and lessons for this batch will be published ahead of the start date."
            compact
          />
        )}
      </section>

      {/* Schedule preview (only for enrolled) */}
      {batch.isPurchased && (
        <section className="space-y-5">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Live classes
              </h2>
              <p className="text-sm text-muted-foreground">
                Upcoming sessions in this batch.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/live">All live classes</Link>
            </Button>
          </div>
          {schedulesQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full" />
              ))}
            </div>
          ) : schedulesQuery.data?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {schedulesQuery.data.slice(0, 6).map((s) => (
                <ScheduleCard key={s.id} schedule={s} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No classes scheduled yet"
              description="Your mentors will post live classes here — check back soon."
              compact
            />
          )}
        </section>
      )}

      {/* Bottom CTA */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 sm:p-12">
        <GradientOrb color="indigo" size="lg" className="-right-20 -top-20 opacity-40" />
        <div className="relative grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-center">
          <div>
            <h3 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              Ready to join <span className="gradient-text">{batch.name}</span>?
            </h3>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Start today. Cancel any time. Focus on the learning — we&apos;ll handle the rest.
            </p>
          </div>
          <div className="flex items-center justify-start gap-3 lg:justify-end">
            <EnrollButton
              kind="BATCH"
              id={batch.id}
              name={batch.name}
              isFree={isFree}
              isEnrolled={Boolean(batch.isPurchased)}
              goToOnEnrolled={`/my-batches/${batch.slug}`}
            />
            <Button asChild variant="outline" size="lg">
              <Link href="/discover">
                More batches <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  tone: "indigo" | "violet" | "emerald" | "amber";
}) {
  const toneBg: Record<string, string> = {
    indigo: "from-indigo-500/15 to-indigo-500/5 text-indigo-500",
    violet: "from-violet-500/15 to-violet-500/5 text-violet-500",
    emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-500",
    amber: "from-amber-500/15 to-amber-500/5 text-amber-600",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${toneBg[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function BatchDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-72 w-full" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
