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
import { GraduationCap, Plus } from "lucide-react";
import { ApiRequestError } from "@/lib/api/errors";
import { BatchesTable } from "./components/batches-table";
import { BatchFormDialog } from "./components/batch-form-dialog";
import type { Batch } from "@/types";

export function BatchesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Batch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["batches", page],
    queryFn: () =>
      apiGetPaginated<Batch>(endpoints.batches.list, {
        params: { page, limit: 10 },
      }),
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiPost(endpoints.batches.create, body),
    onSuccess: () => {
      toast.success("Batch created");
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setFormOpen(false);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to create batch",
      ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiPut(endpoints.batches.update(id), body),
    onSuccess: () => {
      toast.success("Batch updated");
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to update batch",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(endpoints.batches.delete(id)),
    onSuccess: () => {
      toast.success("Batch deleted");
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setDeleteTarget(null);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to delete batch",
      ),
  });

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (batch: Batch) => {
    setEditing(batch);
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      name: fd.get("name"),
      class: fd.get("class"),
      exam: fd.get("exam"),
      language: fd.get("language") || "English",
      startDate: fd.get("startDate"),
      endDate: fd.get("endDate"),
      totalPrice: Number(fd.get("totalPrice")),
      description: fd.get("description") || undefined,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, body });
    } else {
      createMutation.mutate(body);
    }
  };

  const batches = data?.items ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Batches"
        description="Manage your course batches"
        action={
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Batch
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No batches yet"
          description="Create your first batch to get started"
          action={
            <Button onClick={openCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Batch
            </Button>
          }
        />
      ) : (
        <>
          <BatchesTable
            batches={batches}
            onEdit={openEdit}
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

      <BatchFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSubmit={handleSubmit}
        isPending={isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Batch"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
