import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiGetRaw, apiPost, apiDelete } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus } from "lucide-react";
import type { Batch, Subject, Chapter, Topic, Content } from "@/types";
import { ApiRequestError } from "@/lib/api/errors";

import type { CurriculumState } from "./types";
import { LEVEL_LABELS } from "./types";
import {
  CurriculumBreadcrumbs,
  type Crumb,
} from "./components/curriculum-breadcrumbs";
import { BatchCard } from "./components/batch-card";
import { SubjectCard } from "./components/subject-card";
import { ChapterCard } from "./components/chapter-card";
import { TopicCard } from "./components/topic-card";
import { ContentCard } from "./components/content-card";
import { CreateItemDialog } from "./components/create-item-dialog";

function normalizeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if ("data" in record && Array.isArray(record.data))
      return record.data as T[];
    if ("batches" in record && Array.isArray(record.batches))
      return record.batches as T[];
  }
  return [];
}

function buildCrumbs(state: CurriculumState): Crumb[] {
  const crumbs: Crumb[] = [{ label: "All Batches", level: "batches" }];
  if (state.batchName)
    crumbs.push({ label: state.batchName, level: "subjects" });
  if (state.subjectName)
    crumbs.push({ label: state.subjectName, level: "chapters" });
  if (state.chapterName)
    crumbs.push({ label: state.chapterName, level: "topics" });
  if (state.topicName)
    crumbs.push({ label: state.topicName, level: "contents" });
  return crumbs;
}

export function CurriculumPage() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<CurriculumState>({ level: "batches" });
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const batchesQuery = useQuery({
    queryKey: ["curriculum-batches"],
    queryFn: () =>
      apiGetRaw<unknown>(endpoints.batches.list, {
        params: { page: 1, limit: 100 },
      }),
    enabled: state.level === "batches",
  });

  const subjectsQuery = useQuery({
    queryKey: ["subjects", state.batchId],
    queryFn: () =>
      apiGet<Subject[]>(endpoints.subjects.byBatch(state.batchId!)),
    enabled: state.level === "subjects" && !!state.batchId,
  });

  const chaptersQuery = useQuery({
    queryKey: ["chapters", state.subjectId],
    queryFn: () =>
      apiGet<Chapter[]>(endpoints.chapters.bySubject(state.subjectId!)),
    enabled: state.level === "chapters" && !!state.subjectId,
  });

  const topicsQuery = useQuery({
    queryKey: ["topics", state.chapterId],
    queryFn: () =>
      apiGet<Topic[]>(endpoints.topics.byChapter(state.chapterId!)),
    enabled: state.level === "topics" && !!state.chapterId,
  });

  const contentsQuery = useQuery({
    queryKey: ["contents", state.topicId],
    queryFn: () =>
      apiGet<Content[]>(endpoints.contents.byTopic(state.topicId!)),
    enabled: state.level === "contents" && !!state.topicId,
  });

  const navigateToCrumb = useCallback(
    (level: string) => {
      switch (level) {
        case "batches":
          setState({ level: "batches" });
          break;
        case "subjects":
          setState({
            level: "subjects",
            batchId: state.batchId,
            batchName: state.batchName,
          });
          break;
        case "chapters":
          setState({
            level: "chapters",
            batchId: state.batchId,
            batchName: state.batchName,
            subjectId: state.subjectId,
            subjectName: state.subjectName,
          });
          break;
        case "topics":
          setState({
            level: "topics",
            batchId: state.batchId,
            batchName: state.batchName,
            subjectId: state.subjectId,
            subjectName: state.subjectName,
            chapterId: state.chapterId,
            chapterName: state.chapterName,
          });
          break;
      }
    },
    [state],
  );

  const handleCreate = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const name = String(fd.get("name"));

      const configMap = {
        subjects: {
          endpoint: endpoints.subjects.create,
          body: { name, batchId: state.batchId },
        },
        chapters: {
          endpoint: endpoints.chapters.create,
          body: { name, subjectId: state.subjectId, lectureCount: 0 },
        },
        topics: {
          endpoint: endpoints.topics.create,
          body: { name, chapterId: state.chapterId },
        },
        contents: {
          endpoint: endpoints.contents.create,
          body: {
            topicId: state.topicId,
            type: fd.get("type") || "Lecture",
            title: name,
            videoUrl: fd.get("videoUrl") || undefined,
            videoType: fd.get("videoType") || undefined,
            pdfUrl: fd.get("pdfUrl") || undefined,
          },
        },
      } as const;

      const config = configMap[state.level as keyof typeof configMap];
      if (!config) return;

      apiPost(config.endpoint, config.body)
        .then(() => {
          toast.success("Created successfully");
          queryClient.invalidateQueries();
          setFormOpen(false);
        })
        .catch((err) =>
          toast.error(
            err instanceof ApiRequestError ? err.message : "Creation failed",
          ),
        );
    },
    [state, queryClient],
  );

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    setDeleting(true);

    const endpointMap: Record<string, (id: string) => string> = {
      subjects: endpoints.subjects.delete,
      chapters: endpoints.chapters.delete,
      topics: endpoints.topics.delete,
      contents: endpoints.contents.delete,
    };

    const getEndpoint = endpointMap[state.level];
    if (!getEndpoint) return;

    apiDelete(getEndpoint(deleteTarget.id))
      .then(() => {
        toast.success("Deleted");
        queryClient.invalidateQueries();
        setDeleteTarget(null);
      })
      .catch((err) =>
        toast.error(
          err instanceof ApiRequestError ? err.message : "Deletion failed",
        ),
      )
      .finally(() => setDeleting(false));
  }, [deleteTarget, state.level, queryClient]);

  const batches = normalizeArray<Batch>(batchesQuery.data);
  const subjects = normalizeArray<Subject>(subjectsQuery.data);
  const chapters = normalizeArray<Chapter>(chaptersQuery.data);
  const topics = normalizeArray<Topic>(topicsQuery.data);
  const contents = normalizeArray<Content>(contentsQuery.data);

  const isLoading =
    (state.level === "batches" && batchesQuery.isLoading) ||
    (state.level === "subjects" && subjectsQuery.isLoading) ||
    (state.level === "chapters" && chaptersQuery.isLoading) ||
    (state.level === "topics" && topicsQuery.isLoading) ||
    (state.level === "contents" && contentsQuery.isLoading);

  const levelLabel =
    state.level !== "batches" ? LEVEL_LABELS[state.level] : "Batch";
  const crumbs = buildCrumbs(state);

  const markForDelete = (id: string, name: string, type: string) =>
    setDeleteTarget({ id, name, type });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Curriculum"
        description="Manage your course content hierarchy"
        action={
          state.level !== "batches" ? (
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add {levelLabel}
            </Button>
          ) : undefined
        }
      />

      <CurriculumBreadcrumbs crumbs={crumbs} onNavigate={navigateToCrumb} />

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[58px] rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && state.level === "batches" && (
        <BatchList
          batches={batches}
          onSelect={(batch) =>
            setState({
              level: "subjects",
              batchId: batch.id,
              batchName: batch.name,
            })
          }
        />
      )}

      {!isLoading && state.level === "subjects" && (
        <SubjectList
          subjects={subjects}
          parentName={state.batchName}
          onSelect={(subject) =>
            setState({
              ...state,
              level: "chapters",
              subjectId: subject.id,
              subjectName: subject.name,
            })
          }
          onDelete={(s) => markForDelete(s.id, s.name, "subject")}
          onAdd={() => setFormOpen(true)}
        />
      )}

      {!isLoading && state.level === "chapters" && (
        <ChapterList
          chapters={chapters}
          parentName={state.subjectName}
          onSelect={(chapter) =>
            setState({
              ...state,
              level: "topics",
              chapterId: chapter.id,
              chapterName: chapter.name,
            })
          }
          onDelete={(c) => markForDelete(c.id, c.name, "chapter")}
          onAdd={() => setFormOpen(true)}
        />
      )}

      {!isLoading && state.level === "topics" && (
        <TopicList
          topics={topics}
          parentName={state.chapterName}
          onSelect={(topic) =>
            setState({
              ...state,
              level: "contents",
              topicId: topic.id,
              topicName: topic.name,
            })
          }
          onDelete={(t) => markForDelete(t.id, t.name, "topic")}
          onAdd={() => setFormOpen(true)}
        />
      )}

      {!isLoading && state.level === "contents" && (
        <ContentList
          contents={contents}
          parentName={state.topicName}
          onDelete={(c) =>
            markForDelete(c.id, c.title || c.type, "content")
          }
          onAdd={() => setFormOpen(true)}
        />
      )}

      <CreateItemDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        level={state.level}
        levelLabel={levelLabel}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.type}`}
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}

/* ─── List wrappers ─────────────────────────────────────────────── */

function BatchList({
  batches,
  onSelect,
}: {
  batches: Batch[];
  onSelect: (batch: Batch) => void;
}) {
  if (batches.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No batches found"
        description="Create batches first from the Batches page"
      />
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {batches.map((batch) => (
        <BatchCard key={batch.id} batch={batch} onClick={() => onSelect(batch)} />
      ))}
    </div>
  );
}

function SubjectList({
  subjects,
  parentName,
  onSelect,
  onDelete,
  onAdd,
}: {
  subjects: Subject[];
  parentName?: string;
  onSelect: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
  onAdd: () => void;
}) {
  if (subjects.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No subjects"
        description={`Add subjects to ${parentName}`}
        action={
          <Button size="sm" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        }
      />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.map((subject, i) => (
        <SubjectCard
          key={subject.id}
          subject={subject}
          index={i}
          onClick={() => onSelect(subject)}
          onDelete={() => onDelete(subject)}
        />
      ))}
    </div>
  );
}

function ChapterList({
  chapters,
  parentName,
  onSelect,
  onDelete,
  onAdd,
}: {
  chapters: Chapter[];
  parentName?: string;
  onSelect: (chapter: Chapter) => void;
  onDelete: (chapter: Chapter) => void;
  onAdd: () => void;
}) {
  if (chapters.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No chapters"
        description={`Add chapters to ${parentName}`}
        action={
          <Button size="sm" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Chapter
          </Button>
        }
      />
    );
  }
  return (
    <div className="space-y-2">
      {chapters.map((chapter, i) => (
        <ChapterCard
          key={chapter.id}
          chapter={chapter}
          index={i}
          onClick={() => onSelect(chapter)}
          onDelete={() => onDelete(chapter)}
        />
      ))}
    </div>
  );
}

function TopicList({
  topics,
  parentName,
  onSelect,
  onDelete,
  onAdd,
}: {
  topics: Topic[];
  parentName?: string;
  onSelect: (topic: Topic) => void;
  onDelete: (topic: Topic) => void;
  onAdd: () => void;
}) {
  if (topics.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No topics"
        description={`Add topics to ${parentName}`}
        action={
          <Button size="sm" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Topic
          </Button>
        }
      />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {topics.map((topic) => (
        <TopicCard
          key={topic.id}
          topic={topic}
          onClick={() => onSelect(topic)}
          onDelete={() => onDelete(topic)}
        />
      ))}
    </div>
  );
}

function ContentList({
  contents,
  parentName,
  onDelete,
  onAdd,
}: {
  contents: Content[];
  parentName?: string;
  onDelete: (content: Content) => void;
  onAdd: () => void;
}) {
  if (contents.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No content"
        description={`Add content to ${parentName}`}
        action={
          <Button size="sm" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Content
          </Button>
        }
      />
    );
  }
  return (
    <div className="space-y-2">
      {contents.map((content, i) => (
        <ContentCard
          key={content.id}
          content={content}
          index={i}
          onDelete={() => onDelete(content)}
        />
      ))}
    </div>
  );
}
