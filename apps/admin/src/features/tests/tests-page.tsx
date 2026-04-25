import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Plus, Pencil, Trash2, Send } from "lucide-react";
import type { Test, TestSeries } from "@/types";
import { ApiRequestError } from "@/lib/api/errors";

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

      <div className="mb-6 max-w-sm space-y-2">
        <Label>Select Test Series</Label>
        <Select value={selectedSeriesId} onValueChange={setSelectedSeriesId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a test series..." />
          </SelectTrigger>
          <SelectContent>
            {allSeries.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="font-medium">{test.title}</TableCell>
                  <TableCell>{test.duration} min</TableCell>
                  <TableCell>{test.totalMarks}</TableCell>
                  <TableCell>
                    <Badge
                      variant={test.isPublished ? "success" : "secondary"}
                    >
                      {test.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!test.isPublished && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => publishMutation.mutate(test.id)}
                          title="Publish"
                        >
                          <Send className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(test);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(test)}
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
              {editing ? "Edit Test" : "Create Test"}
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
            {!editing && (
              <div className="space-y-2">
                <Label htmlFor="testSeriesId">Test Series</Label>
                <Select
                  name="testSeriesId"
                  defaultValue={selectedSeriesId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allSeries.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
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
              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total Marks</Label>
                <Input
                  id="totalMarks"
                  name="totalMarks"
                  type="number"
                  defaultValue={editing?.totalMarks ?? 100}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passingMarks">Passing</Label>
                <Input
                  id="passingMarks"
                  name="passingMarks"
                  type="number"
                  defaultValue={editing?.passingMarks ?? ""}
                />
              </div>
            </div>
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
              <Button type="submit">
                {editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
