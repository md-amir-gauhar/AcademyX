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
import type { Teacher } from "@/types";

interface TeacherFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Teacher | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}

export function TeacherFormDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
  isPending,
}: TeacherFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Teacher" : "Add Teacher"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
