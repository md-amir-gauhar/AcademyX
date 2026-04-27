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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Test, TestSeries } from "@/types";

interface TestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Test | null;
  allSeries: TestSeries[];
  selectedSeriesId: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function TestFormDialog({
  open,
  onOpenChange,
  editing,
  allSeries,
  selectedSeriesId,
  onSubmit,
}: TestFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Test" : "Create Test"}
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
              onClick={() => onOpenChange(false)}
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
  );
}
