"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  FileText,
  Layers,
  PlayCircle,
  Trophy,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  useChapters,
  useContents,
  useSubjects,
  useTopics,
} from "@/hooks/useCourse";

interface CurriculumTreeProps {
  subjects: { id: string; name: string }[];
  batchId: string;
  batchSlug: string;
}

export function CurriculumTree({
  subjects,
  batchId,
  batchSlug,
}: CurriculumTreeProps) {
  const [selectedSubject, setSelectedSubject] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    if (!selectedSubject && subjects[0]) {
      setSelectedSubject(subjects[0].id);
    }
  }, [subjects, selectedSubject]);

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Card className="h-fit overflow-hidden p-2">
        <div className="max-h-[60vh] overflow-y-auto">
          {subjects.map((s) => (
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

export function CurriculumTreeSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

function SubjectChapters({
  subjectId,
  batchSlug,
}: {
  subjectId: string;
  batchSlug: string;
}) {
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
        <ChapterRow
          key={c.id}
          chapterId={c.id}
          name={c.name}
          description={c.description}
          batchSlug={batchSlug}
        />
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

function ChapterTopics({
  chapterId,
  batchSlug,
}: {
  chapterId: string;
  batchSlug: string;
}) {
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
        <TopicBlock
          key={t.id}
          topicId={t.id}
          name={t.name}
          batchSlug={batchSlug}
        />
      ))}
    </ol>
  );
}

function TopicBlock({
  topicId,
  name,
  batchSlug,
}: {
  topicId: string;
  name: string;
  batchSlug: string;
}) {
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
                    <span className="flex-1 line-clamp-1">
                      {c.title || c.name}
                    </span>
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
  if (type === "Lecture")
    return <PlayCircle className="h-4 w-4 text-indigo-500" />;
  if (type === "PDF") return <FileText className="h-4 w-4 text-rose-500" />;
  if (type === "Quiz") return <Trophy className="h-4 w-4 text-amber-500" />;
  return <BookOpen className="h-4 w-4 text-muted-foreground" />;
}
