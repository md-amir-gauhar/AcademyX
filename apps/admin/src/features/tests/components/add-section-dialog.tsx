import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiRequestError } from "@/lib/api/errors";
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

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string;
  nextOrder: number;
}

export function AddSectionDialog({
  open,
  onOpenChange,
  testId,
  nextOrder,
}: AddSectionDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost(endpoints.tests.sections.create(testId), {
        name,
        displayOrder: nextOrder,
      }),
    onSuccess: () => {
      toast.success("Section added");
      queryClient.invalidateQueries({ queryKey: ["test-sections", testId] });
      setName("");
      onOpenChange(false);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to create",
      ),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section-name">Section name</Label>
            <Input
              id="section-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Physics, Reading Comprehension, Section A"
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
