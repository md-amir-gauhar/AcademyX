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
import { GraduationCap, Plus, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
const EXAMS = ["JEE","NEET","UPSC","BANK","SSC","GATE","CAT","NDA","CLAT","OTHER"] as const;
const CLASS_LEVELS = ["11","12","12+","Grad"] as const;
import type { Batch } from "@/types";
import { ApiRequestError } from "@/lib/api/errors";

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
          {[...Array(5)].map((_, i) => (
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
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.name}</TableCell>
                    <TableCell>{batch.class}</TableCell>
                    <TableCell>{batch.exam}</TableCell>
                    <TableCell>
                      {batch.totalPrice > 0 ? `₹${batch.totalPrice}` : "Free"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          batch.status === "PUBLISHED"
                            ? "success"
                            : batch.status === "DRAFT"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {batch.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(batch.startDate)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(batch)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(batch)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Batch" : "Create Batch"}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Select name="class" defaultValue={editing?.class || "12"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_LEVELS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={
                    editing?.startDate
                      ? new Date(editing.startDate).toISOString().split("T")[0]
                      : ""
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={
                    editing?.endDate
                      ? new Date(editing.endDate).toISOString().split("T")[0]
                      : ""
                  }
                  required
                />
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
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  name="language"
                  defaultValue={editing?.language || "English"}
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
        title="Delete Batch"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
