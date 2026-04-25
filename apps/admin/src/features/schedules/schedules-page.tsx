import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Calendar, Plus, Pencil, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { Schedule } from "@/types";
import { ApiRequestError } from "@/lib/api/errors";

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
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Scheduled At</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">
                    {schedule.title}
                  </TableCell>
                  <TableCell>{schedule.subjectName}</TableCell>
                  <TableCell>{formatDateTime(schedule.scheduledAt)}</TableCell>
                  <TableCell>{schedule.duration} min</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        schedule.status === "COMPLETED"
                          ? "success"
                          : schedule.status === "LIVE"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {schedule.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(schedule);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(schedule)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Schedule" : "Create Schedule"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={editing?.title}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subjectName">Subject Name</Label>
                <Input
                  id="subjectName"
                  name="subjectName"
                  defaultValue={editing?.subjectName}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  defaultValue={editing?.duration ?? 60}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Scheduled At</Label>
              <Input
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                defaultValue={
                  editing?.scheduledAt
                    ? new Date(editing.scheduledAt).toISOString().slice(0, 16)
                    : ""
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtubeLink">YouTube Link</Label>
              <Input
                id="youtubeLink"
                name="youtubeLink"
                defaultValue={editing?.youtubeLink ?? ""}
                placeholder="https://youtube.com/..."
              />
            </div>
            {!editing && (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="topicId">Topic ID</Label>
                  <Input id="topicId" name="topicId" placeholder="UUID" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchId">Batch ID</Label>
                  <Input id="batchId" name="batchId" placeholder="UUID" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subjectId">Subject ID</Label>
                  <Input id="subjectId" name="subjectId" placeholder="UUID" />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editing?.description ?? ""}
                rows={2}
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
                {editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
