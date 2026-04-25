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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Plus, Pencil, Trash2 } from "lucide-react";
const EXAMS = ["JEE","NEET","UPSC","BANK","SSC","GATE","CAT","NDA","CLAT","OTHER"] as const;
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
    const body: Record<string, unknown> = {
      title: fd.get("title"),
      slug: fd.get("slug"),
      exam: fd.get("exam"),
      totalPrice: Number(fd.get("totalPrice")),
      description: fd.get("description") || undefined,
      durationDays: Number(fd.get("durationDays")) || undefined,
      isFree: fd.get("totalPrice") === "0",
    };

    if (editing) updateMutation.mutate({ id: editing.id, body });
    else createMutation.mutate(body);
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
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((series) => (
                  <TableRow key={series.id}>
                    <TableCell className="font-medium">
                      {series.title}
                    </TableCell>
                    <TableCell>{series.exam}</TableCell>
                    <TableCell>
                      {series.isFree
                        ? "Free"
                        : `₹${series.totalPrice}`}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          series.status === "PUBLISHED"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {series.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(series);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(series)}
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
          {data?.pagination && (
            <DataTablePagination
              pagination={data.pagination}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Test Series" : "Create Test Series"}
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
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={editing?.slug}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exam">Exam</Label>
                <Select name="exam" defaultValue={editing?.exam || "JEE"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAMS.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalPrice">Price (₹)</Label>
                <Input
                  id="totalPrice"
                  name="totalPrice"
                  type="number"
                  defaultValue={editing?.totalPrice ?? 0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationDays">Duration (days)</Label>
                <Input
                  id="durationDays"
                  name="durationDays"
                  type="number"
                  defaultValue={editing?.durationDays ?? 30}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editing?.description ?? ""}
                rows={3}
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
