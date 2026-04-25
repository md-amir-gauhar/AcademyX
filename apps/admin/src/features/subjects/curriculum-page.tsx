import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiGetRaw, apiPost, apiDelete } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Plus,
  Trash2,
  ChevronRight,
  FileText,
  Video,
  FolderOpen,
  Layers,
  Hash,
} from "lucide-react";
import type { Batch, Subject, Chapter, Topic, Content } from "@/types";
import { ApiRequestError } from "@/lib/api/errors";

interface Crumb {
  label: string;
  level: string;
}

interface CurriculumState {
  level: "batches" | "subjects" | "chapters" | "topics" | "contents";
  batchId?: string;
  batchName?: string;
  subjectId?: string;
  subjectName?: string;
  chapterId?: string;
  chapterName?: string;
  topicId?: string;
  topicName?: string;
}

function normalizeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    if ("data" in data && Array.isArray((data as Record<string, unknown>).data))
      return (data as Record<string, unknown>).data as T[];
    if (
      "batches" in data &&
      Array.isArray((data as Record<string, unknown>).batches)
    )
      return (data as Record<string, unknown>).batches as T[];
  }
  return [];
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
    queryFn: () => apiGet<Subject[]>(endpoints.subjects.byBatch(state.batchId!)),
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
    queryFn: () => apiGet<Topic[]>(endpoints.topics.byChapter(state.chapterId!)),
    enabled: state.level === "topics" && !!state.chapterId,
  });

  const contentsQuery = useQuery({
    queryKey: ["contents", state.topicId],
    queryFn: () => apiGet<Content[]>(endpoints.contents.byTopic(state.topicId!)),
    enabled: state.level === "contents" && !!state.topicId,
  });

  const crumbs: Crumb[] = [{ label: "All Batches", level: "batches" }];
  if (state.batchName)
    crumbs.push({ label: state.batchName, level: "subjects" });
  if (state.subjectName)
    crumbs.push({ label: state.subjectName, level: "chapters" });
  if (state.chapterName)
    crumbs.push({ label: state.chapterName, level: "topics" });
  if (state.topicName)
    crumbs.push({ label: state.topicName, level: "contents" });

  const navigateToCrumb = (level: string) => {
    if (level === "batches") setState({ level: "batches" });
    else if (level === "subjects")
      setState({
        level: "subjects",
        batchId: state.batchId,
        batchName: state.batchName,
      });
    else if (level === "chapters")
      setState({
        level: "chapters",
        batchId: state.batchId,
        batchName: state.batchName,
        subjectId: state.subjectId,
        subjectName: state.subjectName,
      });
    else if (level === "topics")
      setState({
        level: "topics",
        batchId: state.batchId,
        batchName: state.batchName,
        subjectId: state.subjectId,
        subjectName: state.subjectName,
        chapterId: state.chapterId,
        chapterName: state.chapterName,
      });
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name"));

    let endpoint = "";
    let body: Record<string, unknown> = {};

    if (state.level === "subjects") {
      endpoint = endpoints.subjects.create;
      body = { name, batchId: state.batchId };
    } else if (state.level === "chapters") {
      endpoint = endpoints.chapters.create;
      body = { name, subjectId: state.subjectId, lectureCount: 0 };
    } else if (state.level === "topics") {
      endpoint = endpoints.topics.create;
      body = { name, chapterId: state.chapterId };
    } else if (state.level === "contents") {
      endpoint = endpoints.contents.create;
      body = {
        topicId: state.topicId,
        type: fd.get("type") || "Lecture",
        title: name,
        videoUrl: fd.get("videoUrl") || undefined,
        videoType: fd.get("videoType") || undefined,
        pdfUrl: fd.get("pdfUrl") || undefined,
      };
    }

    if (!endpoint) return;

    apiPost(endpoint, body)
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
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    let endpoint = "";
    if (state.level === "subjects")
      endpoint = endpoints.subjects.delete(deleteTarget.id);
    else if (state.level === "chapters")
      endpoint = endpoints.chapters.delete(deleteTarget.id);
    else if (state.level === "topics")
      endpoint = endpoints.topics.delete(deleteTarget.id);
    else if (state.level === "contents")
      endpoint = endpoints.contents.delete(deleteTarget.id);

    apiDelete(endpoint)
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
  };

  const levelLabel =
    state.level === "subjects"
      ? "Subject"
      : state.level === "chapters"
        ? "Chapter"
        : state.level === "topics"
          ? "Topic"
          : "Content";

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

      {crumbs.length > 1 && (
        <nav className="mb-5 flex items-center gap-1 text-sm">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <span key={crumb.level} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                )}
                {isLast ? (
                  <span className="font-medium text-foreground">
                    {crumb.label}
                  </span>
                ) : (
                  <button
                    onClick={() => navigateToCrumb(crumb.level)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </button>
                )}
              </span>
            );
          })}
        </nav>
      )}

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[58px] rounded-lg" />
          ))}
        </div>
      )}

      {/* ── BATCHES ── large cards with description + badges */}
      {!isLoading && state.level === "batches" && (
        <>
          {batches.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No batches found"
              description="Create batches first from the Batches page"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-primary/50 hover:shadow-md"
                  onClick={() =>
                    setState({
                      level: "subjects",
                      batchId: batch.id,
                      batchName: batch.name,
                    })
                  }
                >
                  <div className="h-1.5 bg-gradient-to-r from-primary/80 to-primary/30" />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold">
                          {batch.name}
                        </h3>
                        {batch.description && (
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {batch.description.replace(/<[^>]*>/g, "")}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="secondary">{batch.exam}</Badge>
                      <Badge variant="outline">Class {batch.class}</Badge>
                      <span className="ml-auto text-[11px] text-muted-foreground">
                        {batch.language || "English"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── SUBJECTS ── colored left-border cards */}
      {!isLoading && state.level === "subjects" && (
        <>
          {subjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No subjects"
              description={`Add subjects to ${state.batchName}`}
              action={
                <Button size="sm" onClick={() => setFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subject
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject, i) => {
                const colors = [
                  "border-l-emerald-500",
                  "border-l-sky-500",
                  "border-l-amber-500",
                  "border-l-rose-500",
                  "border-l-violet-500",
                  "border-l-teal-500",
                ];
                const bgColors = [
                  "bg-emerald-500/10 text-emerald-500",
                  "bg-sky-500/10 text-sky-500",
                  "bg-amber-500/10 text-amber-500",
                  "bg-rose-500/10 text-rose-500",
                  "bg-violet-500/10 text-violet-500",
                  "bg-teal-500/10 text-teal-500",
                ];
                const color = colors[i % colors.length];
                const bgColor = bgColors[i % bgColors.length];

                return (
                  <div
                    key={subject.id}
                    className={`group flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 border-l-[3px] ${color} bg-card p-4 transition-all hover:shadow-sm`}
                    onClick={() =>
                      setState({
                        ...state,
                        level: "chapters",
                        subjectId: subject.id,
                        subjectName: subject.name,
                      })
                    }
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bgColor}`}
                    >
                      <FolderOpen className="h-[18px] w-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{subject.name}</p>
                      <p className="text-[11px] text-muted-foreground">Subject</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({
                            id: subject.id,
                            name: subject.name,
                            type: "subject",
                          });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── CHAPTERS ── numbered list-style cards */}
      {!isLoading && state.level === "chapters" && (
        <>
          {chapters.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No chapters"
              description={`Add chapters to ${state.subjectName}`}
              action={
                <Button size="sm" onClick={() => setFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Chapter
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {chapters.map((chapter, i) => (
                <div
                  key={chapter.id}
                  className="group flex cursor-pointer items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-3 transition-all hover:border-sky-500/30 hover:shadow-sm"
                  onClick={() =>
                    setState({
                      ...state,
                      level: "topics",
                      chapterId: chapter.id,
                      chapterName: chapter.name,
                    })
                  }
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sm font-bold text-sky-500">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{chapter.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {chapter.lectureCount} lecture{chapter.lectureCount !== 1 ? "s" : ""}
                      {chapter.lectureDuration ? ` · ${chapter.lectureDuration}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({
                          id: chapter.id,
                          name: chapter.name,
                          type: "chapter",
                        });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TOPICS ── compact pill-style items in a grid */}
      {!isLoading && state.level === "topics" && (
        <>
          {topics.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No topics"
              description={`Add topics to ${state.chapterName}`}
              action={
                <Button size="sm" onClick={() => setFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Topic
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3 transition-all hover:border-amber-500/30 hover:shadow-sm"
                  onClick={() =>
                    setState({
                      ...state,
                      level: "contents",
                      topicId: topic.id,
                      topicName: topic.name,
                    })
                  }
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
                    <BookOpen className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    {topic.name}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({
                          id: topic.id,
                          name: topic.name,
                          type: "topic",
                        });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── CONTENTS ── flat list with type-specific styling */}
      {!isLoading && state.level === "contents" && (
        <>
          {contents.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No content"
              description={`Add content to ${state.topicName}`}
              action={
                <Button size="sm" onClick={() => setFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Content
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {contents.map((content, i) => (
                <div
                  key={content.id}
                  className="group flex items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-3 transition-all hover:shadow-sm"
                >
                  <span className="w-5 text-center text-xs text-muted-foreground">
                    {i + 1}
                  </span>
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      content.type === "Lecture"
                        ? "bg-primary/10"
                        : "bg-orange-500/10"
                    }`}
                  >
                    {content.type === "Lecture" ? (
                      <Video className="h-4 w-4 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {content.title || content.type}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {content.type}
                      {content.videoType ? ` · ${content.videoType}` : ""}
                      {content.videoDuration
                        ? ` · ${content.videoDuration} min`
                        : ""}
                    </p>
                  </div>
                  <Badge
                    variant={content.type === "Lecture" ? "secondary" : "outline"}
                    className="shrink-0 text-[10px]"
                  >
                    {content.type}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() =>
                      setDeleteTarget({
                        id: content.id,
                        name: content.title || content.type,
                        type: "content",
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {levelLabel}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {state.level === "contents" ? "Title" : "Name"}
              </Label>
              <Input id="name" name="name" required />
            </div>
            {state.level === "contents" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select name="type" defaultValue="Lecture">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lecture">Lecture</SelectItem>
                      <SelectItem value="PDF">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    name="videoUrl"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="videoType">Video Type</Label>
                  <Select name="videoType" defaultValue="YOUTUBE">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YOUTUBE">YouTube</SelectItem>
                      <SelectItem value="HLS">HLS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pdfUrl">PDF URL</Label>
                  <Input id="pdfUrl" name="pdfUrl" placeholder="https://..." />
                </div>
              </>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
