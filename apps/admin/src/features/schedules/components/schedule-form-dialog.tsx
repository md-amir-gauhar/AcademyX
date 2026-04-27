import { Button } from "@/components/ui/button";
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
import type { Schedule } from "@/types";

interface ScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Schedule | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}

export function ScheduleFormDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
  isPending,
}: ScheduleFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Schedule" : "Create Schedule"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
