import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus } from "lucide-react";
import type { Test, TestSeries } from "@/types";
import { ApiRequestError } from "@/lib/api/errors";
import { TestsTable } from "./components/tests-table";
import { TestFormDialog } from "./components/test-form-dialog";
import { SeriesSelector } from "./components/series-selector";

export function TestsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Test | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Test | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("");

  const { data: seriesList } = useQuery({
    queryKey: ["test-series-all"],
    queryFn: () =>
      apiGet<TestSeries[]>(endpoints.testSeries.list, {
        params: { page: 1, limit: 100 },
      }),
  });

  const { data: tests, isLoading } = useQuery({
    queryKey: ["tests", selectedSeriesId],
    queryFn: () =>
      selectedSeriesId
        ? apiGet<Test[]>(endpoints.tests.bySeriesId(selectedSeriesId))
        : Promise.resolve([]),
    enabled: !!selectedSeriesId,
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiPost(endpoints.tests.create, body),
    onSuccess: () => {
      toast.success("Test created");
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      setFormOpen(false);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed",
      ),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Record<string, unknown>;
    }) => apiPut(endpoints.tests.update(id), body),
    onSuccess: () => {
      toast.success("Updated");
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed",
      ),
  });

  const publishMutation = useMutation({
    mutationFn: (testId: string) =>
      apiPost(endpoints.tests.publish(testId)),
    onSuccess: () => {
      toast.success("Test published");
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to publish",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(endpoints.tests.delete(id)),
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      setDeleteTarget(null);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      title: fd.get("title"),
      testSeriesId: fd.get("testSeriesId") || selectedSeriesId,
      duration: Number(fd.get("duration")),
      totalMarks: Number(fd.get("totalMarks")),
      passingMarks: Number(fd.get("passingMarks")) || undefined,
      description: fd.get("description") || undefined,
    };

    if (editing) updateMutation.mutate({ id: editing.id, body });
    else createMutation.mutate(body);
  };

  const list = Array.isArray(tests) ? tests : [];
  const allSeries = Array.isArray(seriesList) ? seriesList : [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tests"
        description="Manage individual tests within test series"
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            size="sm"
            disabled={!selectedSeriesId}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Test
          </Button>
        }
      />

      <SeriesSelector
        allSeries={allSeries}
        value={selectedSeriesId}
        onChange={setSelectedSeriesId}
      />

      {!selectedSeriesId ? (
        <EmptyState
          icon={FileText}
          title="Select a test series"
          description="Choose a test series above to manage its tests"
        />
      ) : isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No tests"
          description="Create your first test in this series"
        />
      ) : (
        <TestsTable
          tests={list}
          onPublish={(testId) => publishMutation.mutate(testId)}
          onEdit={(test) => {
            setEditing(test);
            setFormOpen(true);
          }}
          onDelete={setDeleteTarget}
        />
      )}

      <TestFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        allSeries={allSeries}
        selectedSeriesId={selectedSeriesId}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Test"
        description={`Delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        onConfirm={() =>
          deleteTarget && deleteMutation.mutate(deleteTarget.id)
        }
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
