import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api/client";
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
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ArrowLeft,
  FileText,
  Video,
} from "lucide-react";
import type { Batch, Subject, Chapter, Topic, Content } from "@/types";
import { ApiRequestError } from "@/lib/api/errors";

type View =
  | { level: "batches" }
  | { level: "subjects"; batchId: string; batchName: string }
  | { level: "chapters"; subjectId: string; subjectName: string; batchId: string }
  | { level: "topics"; chapterId: string; chapterName: string; subjectId: string }
  | { level: "contents"; topicId: string; topicName: string; chapterId: string };

export function CurriculumPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>({ level: "batches" });
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);

  const batchesQuery = useQuery({
    queryKey: ["batches-all"],
    queryFn: () =>
      apiGet<Batch[]>(endpoints.batches.list, {
        params: { page: 1, limit: 100 },
      }),
    enabled: view.level === "batches",
  });

  const subjectsQuery = useQuery({
    queryKey: ["subjects", view.level === "subjects" ? view.batchId : ""],
    queryFn: () =>
      view.level === "subjects"
        ? apiGet<Subject[]>(endpoints.subjects.byBatch(view.batchId))
        : Promise.resolve([]),
    enabled: view.level === "subjects",
  });

  const chaptersQuery = useQuery({
    queryKey: ["chapters", view.level === "chapters" ? view.subjectId : ""],
    queryFn: () =>
      view.level === "chapters"
        ? apiGet<Chapter[]>(endpoints.chapters.bySubject(view.subjectId))
        : Promise.resolve([]),
    enabled: view.level === "chapters",
  });

  const topicsQuery = useQuery({
    queryKey: ["topics", view.level === "topics" ? view.chapterId : ""],
    queryFn: () =>
      view.level === "topics"
        ? apiGet<Topic[]>(endpoints.topics.byChapter(view.chapterId))
        : Promise.resolve([]),
    enabled: view.level === "topics",
  });

  const contentsQuery = useQuery({
    queryKey: ["contents", view.level === "contents" ? view.topicId : ""],
    queryFn: () =>
      view.level === "contents"
        ? apiGet<Content[]>(endpoints.contents.byTopic(view.topicId))
        : Promise.resolve([]),
    enabled: view.level === "contents",
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name"));

    let endpoint = "";
    let body: Record<string, unknown> = {};

    if (view.level === "subjects") {
      endpoint = endpoints.subjects.create;
      body = { name, batchId: view.batchId };
    } else if (view.level === "chapters") {
      endpoint = endpoints.chapters.create;
      body = { name, subjectId: view.subjectId, lectureCount: 0 };
    } else if (view.level === "topics") {
      endpoint = endpoints.topics.create;
      body = { name, chapterId: view.chapterId };
    } else if (view.level === "contents") {
      endpoint = endpoints.contents.create;
      body = {
        topicId: view.topicId,
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
    let endpoint = "";
    if (view.level === "subjects")
      endpoint = endpoints.subjects.delete(deleteTarget.id);
    else if (view.level === "chapters")
      endpoint = endpoints.chapters.delete(deleteTarget.id);
    else if (view.level === "topics")
      endpoint = endpoints.topics.delete(deleteTarget.id);
    else if (view.level === "contents")
      endpoint = endpoints.contents.delete(deleteTarget.id);

    apiDelete(endpoint)
      .then(() => {
        toast.success("Deleted successfully");
        queryClient.invalidateQueries();
        setDeleteTarget(null);
      })
      .catch((err) =>
        toast.error(
          err instanceof ApiRequestError ? err.message : "Deletion failed",
        ),
      );
  };

  const goBack = () => {
    if (view.level === "subjects") setView({ level: "batches" });
    else if (view.level === "chapters")
      setView({
        level: "subjects",
        batchId: view.batchId,
        batchName: "",
      });
    else if (view.level === "topics")
      setView({
        level: "chapters",
        subjectId: view.subjectId,
        subjectName: "",
        batchId: "",
      });
    else if (view.level === "contents")
      setView({
        level: "topics",
        chapterId: view.chapterId,
        chapterName: "",
        subjectId: "",
      });
  };

  const breadcrumb =
    view.level === "batches"
      ? "Select a batch"
      : view.level === "subjects"
        ? `Subjects in ${view.batchName || "batch"}`
        : view.level === "chapters"
          ? `Chapters in ${view.subjectName || "subject"}`
          : view.level === "topics"
            ? `Topics in ${view.chapterName || "chapter"}`
            : `Content in ${view.topicName || "topic"}`;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Curriculum"
        description={breadcrumb}
        action={
          <div className="flex items-center gap-2">
            {view.level !== "batches" && (
              <Button variant="outline" size="sm" onClick={goBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            {view.level !== "batches" && (
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add{" "}
                {view.level === "subjects"
                  ? "Subject"
                  : view.level === "chapters"
                    ? "Chapter"
                    : view.level === "topics"
                      ? "Topic"
                      : "Content"}
              </Button>
            )}
          </div>
        }
      />

      {view.level === "batches" && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(Array.isArray(batchesQuery.data) ? batchesQuery.data : []).map(
            (batch) => (
              <Card
                key={batch.id}
                className="cursor-pointer transition-colors hover:border-primary/50"
                onClick={() =>
                  setView({
                    level: "subjects",
                    batchId: batch.id,
                    batchName: batch.name,
                  })
                }
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">{batch.name}</CardTitle>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{batch.exam}</Badge>
                    <Badge variant="outline">Class {batch.class}</Badge>
                  </div>
                </CardContent>
              </Card>
            ),
          )}
          {batchesQuery.isLoading && (
            <>{[...Array(3)].map((_, i) => <Card key={i} className="h-24" />)}</>
          )}
        </div>
      )}

      {view.level === "subjects" && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(Array.isArray(subjectsQuery.data) ? subjectsQuery.data : []).map(
            (subject) => (
              <Card
                key={subject.id}
                className="group cursor-pointer transition-colors hover:border-primary/50"
                onClick={() =>
                  setView({
                    level: "chapters",
                    subjectId: subject.id,
                    subjectName: subject.name,
                    batchId: view.batchId,
                  })
                }
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">{subject.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100"
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
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            ),
          )}
          {(subjectsQuery.data as Subject[] | undefined)?.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={BookOpen}
                title="No subjects"
                description="Add subjects to this batch"
              />
            </div>
          )}
        </div>
      )}

      {view.level === "chapters" && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(Array.isArray(chaptersQuery.data) ? chaptersQuery.data : []).map(
            (chapter) => (
              <Card
                key={chapter.id}
                className="group cursor-pointer transition-colors hover:border-primary/50"
                onClick={() =>
                  setView({
                    level: "topics",
                    chapterId: chapter.id,
                    chapterName: chapter.name,
                    subjectId: view.subjectId,
                  })
                }
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-sm">{chapter.name}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {chapter.lectureCount} lectures
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100"
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
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            ),
          )}
          {(chaptersQuery.data as Chapter[] | undefined)?.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={BookOpen}
                title="No chapters"
                description="Add chapters to this subject"
              />
            </div>
          )}
        </div>
      )}

      {view.level === "topics" && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(Array.isArray(topicsQuery.data) ? topicsQuery.data : []).map(
            (topic) => (
              <Card
                key={topic.id}
                className="group cursor-pointer transition-colors hover:border-primary/50"
                onClick={() =>
                  setView({
                    level: "contents",
                    topicId: topic.id,
                    topicName: topic.name,
                    chapterId: view.chapterId,
                  })
                }
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">{topic.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100"
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
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            ),
          )}
          {(topicsQuery.data as Topic[] | undefined)?.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={BookOpen}
                title="No topics"
                description="Add topics to this chapter"
              />
            </div>
          )}
        </div>
      )}

      {view.level === "contents" && (
        <div className="space-y-3">
          {(Array.isArray(contentsQuery.data) ? contentsQuery.data : []).map(
            (content) => (
              <Card key={content.id} className="group">
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {content.type === "Lecture" ? (
                      <Video className="h-4 w-4 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 text-orange-500" />
                    )}
                    <div>
                      <CardTitle className="text-sm">
                        {content.title || content.type}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {content.type}
                        {content.videoType ? ` (${content.videoType})` : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
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
                </CardHeader>
              </Card>
            ),
          )}
          {(contentsQuery.data as Content[] | undefined)?.length === 0 && (
            <EmptyState
              icon={BookOpen}
              title="No content"
              description="Add content to this topic"
            />
          )}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add{" "}
              {view.level === "subjects"
                ? "Subject"
                : view.level === "chapters"
                  ? "Chapter"
                  : view.level === "topics"
                    ? "Topic"
                    : "Content"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {view.level === "contents" ? "Title" : "Name"}
              </Label>
              <Input id="name" name="name" required />
            </div>
            {view.level === "contents" && (
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
        description={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
