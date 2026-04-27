import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGetPaginated, apiPost, apiPut, apiDelete } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Plus } from "lucide-react";
import { TestSeriesTable } from "./components/test-series-table";
import { TestSeriesFormDialog } from "./components/test-series-form-dialog";
import type { TestSeries } from "@/types";
import { ApiRequestError } from "@/lib/api/errors";

export function TestSeriesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TestSeries | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TestSeries | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["test-series", page],
    queryFn: () =>
      apiGetPaginated<TestSeries>(endpoints.testSeries.list, {
        params: { page, limit: 10 },
      }),
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiPost(endpoints.testSeries.create, body),
    onSuccess: () => {
      toast.success("Test series created");
      queryClient.invalidateQueries({ queryKey: ["test-series"] });
      setFormOpen(false);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed",
      ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiPut(endpoints.testSeries.update(id), body),
    onSuccess: () => {
      toast.success("Updated");
      queryClient.invalidateQueries({ queryKey: ["test-series"] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(endpoints.testSeries.delete(id)),
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: ["test-series"] });
      setDeleteTarget(null);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const totalPrice = Number(fd.get("totalPrice"));
    const discount = Number(fd.get("discountPercentage"));
    const body: Record<string, unknown> = {
      title: fd.get("title"),
      exam: fd.get("exam"),
      totalPrice,
      discountPercentage: Number.isFinite(discount) ? discount : undefined,
      description: fd.get("description") || undefined,
      durationDays: Number(fd.get("durationDays")) || undefined,
      isFree: totalPrice === 0,
    };

    if (editing) updateMutation.mutate({ id: editing.id, body });
    else createMutation.mutate(body);
  };

  const handleEdit = (series: TestSeries) => {
    setEditing(series);
    setFormOpen(true);
  };

  const items = data?.items ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Test Series"
        description="Manage test series for assessments"
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Series
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No test series"
          description="Create your first test series"
        />
      ) : (
        <>
          <TestSeriesTable
            items={items}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
          />
          {data?.pagination && (
            <DataTablePagination
              pagination={data.pagination}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <TestSeriesFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Test Series"
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
