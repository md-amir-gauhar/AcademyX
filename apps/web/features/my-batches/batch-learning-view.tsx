"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  FileText,
  Layers,
  PlayCircle,
  Radio,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { TeacherRow } from "@/components/shared/teacher-row";
import { ScheduleCard } from "@/components/discover/schedule-card";
import { useBatch } from "@/hooks/useBatches";
import {
  useChapters,
  useContents,
  useSubjects,
  useTopics,
} from "@/hooks/useCourse";
import { useSchedulesByBatch } from "@/hooks/useSchedules";
import { getBatchProgress } from "@/services/contentProgressService";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { formatDuration } from "@/lib/utils";

interface BatchLearningViewProps {
  slug: string;
}

export function BatchLearningView({ slug }: BatchLearningViewProps) {
  const batchQuery = useBatch(slug);
  const batch = batchQuery.data;
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken));

  const progress = useQuery({
    queryKey: ["batch-progress", batch?.id],
    queryFn: () => getBatchProgress(batch!.id),
    enabled: Boolean(batch?.id && batch?.isPurchased) && isAuthed,
  });

  if (batchQuery.isLoading) return <LearningViewSkeleton />;

  if (!batch) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Batch not found"
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/my-batches">Back to my batches</Link>
          </Button>
        }
      />
    );
  }

  if (!batch.isPurchased) {
    return (
      <EmptyState
        icon={BookOpen}
        title="You're not enrolled in this batch yet"
        description="Head over to the batch detail page to enroll."
        action={
          <Button asChild variant="gradient" size="sm">
            <Link href={`/discover/${batch.slug}`}>View batch</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Link
        href="/my-batches"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> My batches
      </Link>

      {/* Summary header */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-center">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {batch.exam && <Badge>{batch.exam}</Badge>}
              {batch.class && <Badge variant="outline">Class {batch.class}</Badge>}
              <Badge variant="success">Enrolled</Badge>
            </div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {batch.name}
            </h1>
            {batch.teachers?.length > 0 && (
              <TeacherRow teachers={batch.teachers} max={4} size="md" />
            )}
          </div>
          <Card className="p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Your progress
                </span>
                {progress.data && (
                  <span className="text-xs font-semibold text-primary">
                    {Math.round(progress.data.progressPercentage)}%
                  </span>
                )}
              </div>
              <Progress value={progress.data?.progressPercentage ?? 0} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {progress.data
                    ? `${progress.data.completedVideos} / ${progress.data.totalVideos} lessons`
                    : "Lessons"}
                </span>
                <span>
                  {formatDuration(progress.data?.totalWatchTimeSeconds ?? 0)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Tabs defaultValue="curriculum">
        <TabsList>
          <TabsTrigger value="curriculum">
            <Layers className="h-4 w-4" /> Curriculum
          </TabsTrigger>
          <TabsTrigger value="live">
            <Radio className="h-4 w-4" /> Live classes
          </TabsTrigger>
          <TabsTrigger value="tests">
            <Trophy className="h-4 w-4" /> Tests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum">
          <CurriculumTree batchId={batch.id} batchSlug={batch.slug} />
        </TabsContent>

        <TabsContent value="live">
          <LiveClassesSection batchId={batch.id} />
        </TabsContent>

        <TabsContent value="tests">
          <EmptyState
            icon={Trophy}
            title="Tests are coming to your batch soon"
            description="Batch-linked tests will appear here. Meanwhile, browse our test series."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/tests">Browse test series</Link>
              </Button>
            }
            compact
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------- Curriculum -------------------------- */

function CurriculumTree({ batchId, batchSlug }: { batchId: string; batchSlug: string }) {
  const subjects = useSubjects(batchId);
  const [selectedSubject, setSelectedSubject] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    if (!selectedSubject && subjects.data?.[0]) {
      setSelectedSubject(subjects.data[0].id);
    }
  }, [subjects.data, selectedSubject]);

  if (subjects.isLoading) {
    return (
      <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!subjects.data?.length) {
    return (
      <EmptyState
        icon={Layers}
        title="No subjects yet"
        description="Your mentors are preparing the curriculum — check back in a bit."
        compact
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Card className="h-fit overflow-hidden p-2">
        <div className="max-h-[60vh] overflow-y-auto">
          {subjects.data.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                selectedSubject === s.id
                  ? "bg-gradient-brand text-white shadow-soft"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Layers className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1 flex-1">{s.name}</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            </button>
          ))}
        </div>
      </Card>

      {selectedSubject ? (
        <SubjectChapters subjectId={selectedSubject} batchSlug={batchSlug} />
      ) : null}
    </div>
  );
}

function SubjectChapters({ subjectId, batchSlug }: { subjectId: string; batchSlug: string }) {
  const chapters = useChapters(subjectId);
  if (chapters.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!chapters.data?.length) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No chapters yet"
        description="This subject is still being authored."
        compact
      />
    );
  }

  return (
    <div className="space-y-3">
      {chapters.data.map((c) => (
        <ChapterRow key={c.id} chapterId={c.id} name={c.name} description={c.description} batchSlug={batchSlug} />
      ))}
    </div>
  );
}

function ChapterRow({
  chapterId,
  name,
  description,
  batchSlug,
}: {
  chapterId: string;
  name: string;
  description?: string | null;
  batchSlug: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/40"
      >
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand-soft text-primary">
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-semibold">{name}</p>
          {description && (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <ChevronRight
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-border/60 bg-muted/20 p-4">
          <ChapterTopics chapterId={chapterId} batchSlug={batchSlug} />
        </div>
      )}
    </Card>
  );
}

function ChapterTopics({ chapterId, batchSlug }: { chapterId: string; batchSlug: string }) {
  const topics = useTopics(chapterId);
  if (topics.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  if (!topics.data?.length) {
    return (
      <p className="px-2 py-1 text-xs text-muted-foreground">
        No topics yet.
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {topics.data.map((t) => (
        <TopicBlock key={t.id} topicId={t.id} name={t.name} batchSlug={batchSlug} />
      ))}
    </ol>
  );
}

function TopicBlock({ topicId, name, batchSlug }: { topicId: string; name: string; batchSlug: string }) {
  const [open, setOpen] = React.useState(false);
  const contents = useContents(open ? topicId : undefined);
  return (
    <li className="rounded-xl border border-border/60 bg-background/60">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm"
      >
        <span className="text-muted-foreground">•</span>
        <span className="flex-1 font-medium">{name}</span>
        <ChevronRight
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-border/60 px-4 py-3">
          {contents.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : contents.data?.length ? (
            <ul className="space-y-1.5">
              {contents.data.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/my-batches/${batchSlug}/watch/${c.id}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted/60 transition-colors"
                  >
                    {contentIcon(c.type)}
                    <span className="flex-1 line-clamp-1">{c.title || c.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {c.type}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No lessons yet.</p>
          )}
        </div>
      )}
    </li>
  );
}

function contentIcon(type: string) {
  if (type === "Lecture") return <PlayCircle className="h-4 w-4 text-indigo-500" />;
  if (type === "PDF") return <FileText className="h-4 w-4 text-rose-500" />;
  if (type === "Quiz") return <Trophy className="h-4 w-4 text-amber-500" />;
  return <BookOpen className="h-4 w-4 text-muted-foreground" />;
}

/* -------------------------- Live -------------------------- */

function LiveClassesSection({ batchId }: { batchId: string }) {
  const schedules = useSchedulesByBatch(batchId);
  if (schedules.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    );
  }
  if (!schedules.data?.length) {
    return (
      <EmptyState
        icon={Radio}
        title="No live classes yet"
        description="Upcoming sessions for this batch will appear here."
        compact
      />
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {schedules.data.map((s) => (
        <ScheduleCard key={s.id} schedule={s} />
      ))}
    </div>
  );
}

function LearningViewSkeleton() {
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
