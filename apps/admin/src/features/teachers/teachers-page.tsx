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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Teacher } from "@/types";
import { ApiRequestError } from "@/lib/api/errors";

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

  const list = Array.isArray(teachers) ? teachers : [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Teachers"
        description="Manage your teaching staff"
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
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
          icon={Users}
          title="No teachers yet"
          description="Add your first teacher"
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>
                    {teacher.subjects?.join(", ") || "—"}
                  </TableCell>
                  <TableCell>{formatDate(teacher.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(teacher);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(teacher)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Teacher" : "Add Teacher"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editing?.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                defaultValue={editing?.imageUrl ?? ""}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjects">Subjects (comma-separated)</Label>
              <Input
                id="subjects"
                name="subjects"
                defaultValue={editing?.subjects?.join(", ") ?? ""}
                placeholder="Physics, Chemistry, Math"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editing
                    ? "Update"
                    : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
