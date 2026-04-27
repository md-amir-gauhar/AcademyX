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
import { Users, Plus } from "lucide-react";
import type { Teacher } from "@/types";
import { ApiRequestError } from "@/lib/api/errors";
import { TeachersTable } from "./components/teachers-table";
import { TeacherFormDialog } from "./components/teacher-form-dialog";

export function TeachersPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);

  const { data: teachers, isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => apiGet<Teacher[]>(endpoints.teachers.list),
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiPost(endpoints.teachers.create, body),
    onSuccess: () => {
      toast.success("Teacher created");
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setFormOpen(false);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError
          ? err.message
          : "Failed to create teacher",
      ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiPut(endpoints.teachers.update(id), body),
    onSuccess: () => {
      toast.success("Teacher updated");
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError
          ? err.message
          : "Failed to update teacher",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(endpoints.teachers.delete(id)),
    onSuccess: () => {
      toast.success("Teacher deleted");
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setDeleteTarget(null);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError
          ? err.message
          : "Failed to delete teacher",
      ),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      name: fd.get("name"),
      imageUrl: fd.get("imageUrl") || undefined,
      subjects: fd.get("subjects")
        ? String(fd.get("subjects"))
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, body });
    } else {
      createMutation.mutate(body);
    }
  };

  const openCreateForm = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEditForm = (teacher: Teacher) => {
    setEditing(teacher);
    setFormOpen(true);
  };

  const list = Array.isArray(teachers) ? teachers : [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Teachers"
        description="Manage your teaching staff"
        action={
          <Button onClick={openCreateForm} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teachers yet"
          description="Add your first teacher"
          action={
            <Button onClick={openCreateForm} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          }
        />
      ) : (
        <TeachersTable
          teachers={list}
          onEdit={openEditForm}
          onDelete={setDeleteTarget}
        />
      )}

      <TeacherFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSubmit={handleSubmit}
        isPending={isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Teacher"
        description={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={() =>
          deleteTarget && deleteMutation.mutate(deleteTarget.id)
        }
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
