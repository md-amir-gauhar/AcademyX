import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
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
import { EXAMS } from "@/lib/constants";
import type { TestSeries } from "@/types";

interface TestSeriesFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: TestSeries | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}

export function TestSeriesFormDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
  isPending,
}: TestSeriesFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Test Series" : "Create Test Series"}
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
            <RichTextEditor
              id="description"
              name="description"
              defaultValue={editing?.description ?? ""}
              placeholder="Describe the test series, what's included, and who it's for..."
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
