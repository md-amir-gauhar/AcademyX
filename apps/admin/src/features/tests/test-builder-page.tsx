import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiRequestError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ArrowLeft,
  ChevronRight,
  Plus,
  Send,
  Clock,
  Trophy,
  Layers,
} from "lucide-react";
import type { Test, TestSection } from "@/types";
import { SectionCard } from "./components/section-card";
import { AddSectionDialog } from "./components/add-section-dialog";

export function TestBuilderPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addSectionOpen, setAddSectionOpen] = useState(false);

  const testQuery = useQuery({
    queryKey: ["test-detail", testId],
    queryFn: () => apiGet<Test>(endpoints.tests.byIdentifier(testId!)),
    enabled: !!testId,
  });

  const sectionsQuery = useQuery({
    queryKey: ["test-sections", testId],
    queryFn: () =>
      apiGet<TestSection[]>(endpoints.tests.sections.list(testId!)),
    enabled: !!testId,
  });

  const publishMutation = useMutation({
    mutationFn: () => apiPost(endpoints.tests.publish(testId!)),
    onSuccess: () => {
      toast.success("Test published");
      queryClient.invalidateQueries({ queryKey: ["test-detail", testId] });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to publish",
      ),
  });

  if (testQuery.isLoading) {
    return <BuilderSkeleton />;
  }

  if (!testQuery.data) {
    return (
      <EmptyState
        icon={Layers}
        title="Test not found"
        description="It may have been deleted or you don't have access."
        action={
          <Button variant="outline" onClick={() => navigate("/tests")}>
            Back to tests
          </Button>
        }
      />
    );
  }

  const test = testQuery.data;
  const sections = sectionsQuery.data ?? [];
  const nextOrder =
    sections.length > 0
      ? Math.max(...sections.map((s) => s.displayOrder)) + 1
      : 0;

  return (
    <div className="animate-fade-in">
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link
          to="/tests"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Tests
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-50" />
        <span className="font-medium text-foreground">{test.title}</span>
      </nav>

      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-border/60 bg-gradient-to-br from-card to-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {test.title}
            </h1>
            <Badge variant={test.isPublished ? "success" : "secondary"}>
              {test.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {test.duration} min
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              {test.totalMarks} marks
              {test.passingMarks ? ` · pass ${test.passingMarks}` : ""}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              {sections.length} section{sections.length !== 1 ? "s" : ""}
            </span>
          </div>
          {test.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {test.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!test.isPublished && (
            <Button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending || sections.length === 0}
              size="sm"
              variant="default"
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {publishMutation.isPending ? "Publishing..." : "Publish Test"}
            </Button>
          )}
          <Button
            size="sm"
            variant={sections.length === 0 ? "default" : "outline"}
            onClick={() => setAddSectionOpen(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Section
          </Button>
        </div>
      </div>

      {sectionsQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : sections.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No sections yet"
          description="Sections group questions together (e.g. Physics, Chemistry, Math). Add your first section to start building this test."
          action={
            <Button onClick={() => setAddSectionOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add First Section
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sections
            .slice()
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                testId={test.id}
                onDeleted={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["test-sections", test.id],
                  })
                }
              />
            ))}
        </div>
      )}

      <AddSectionDialog
        open={addSectionOpen}
        onOpenChange={setAddSectionOpen}
        testId={test.id}
        nextOrder={nextOrder}
      />
    </div>
  );
}

function BuilderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}
