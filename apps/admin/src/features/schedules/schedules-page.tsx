import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Plus } from "lucide-react";
import type { Schedule } from "@/types";
import { ApiRequestError } from "@/lib/api/errors";
import { SchedulesTable } from "./components/schedules-table";
import { ScheduleFormDialog } from "./components/schedule-form-dialog";

export function SchedulesPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["schedules"],
    queryFn: () =>
      apiGet<Schedule[]>(endpoints.schedules.list, {
        params: { page: 1, limit: 50 },
      }),
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiPost(endpoints.schedules.create, body),
    onSuccess: () => {
      toast.success("Schedule created");
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setFormOpen(false);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to create",
      ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiPatch(endpoints.schedules.update(id), body),
    onSuccess: () => {
      toast.success("Schedule updated");
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to update",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(endpoints.schedules.delete(id)),
    onSuccess: () => {
      toast.success("Schedule deleted");
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setDeleteTarget(null);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      title: fd.get("title"),
      subjectName: fd.get("subjectName"),
      scheduledAt: fd.get("scheduledAt"),
      duration: Number(fd.get("duration")),
      youtubeLink: fd.get("youtubeLink") || undefined,
      description: fd.get("description") || undefined,
      topicId: fd.get("topicId") || undefined,
      batchId: fd.get("batchId") || undefined,
      subjectId: fd.get("subjectId") || undefined,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, body });
    } else {
      createMutation.mutate(body);
    }
  };

  const list = Array.isArray(data) ? data : [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Schedules"
        description="Manage live class schedules"
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Schedule
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No schedules"
          description="Create your first schedule"
        />
      ) : (
        <SchedulesTable
          schedules={list}
          onEdit={(schedule) => {
            setEditing(schedule);
            setFormOpen(true);
          }}
          onDelete={setDeleteTarget}
        />
      )}

      <ScheduleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Schedule"
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
