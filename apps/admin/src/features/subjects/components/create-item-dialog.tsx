import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { CurriculumLevel } from "../types";

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: CurriculumLevel;
  levelLabel: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function CreateItemDialog({
  open,
  onOpenChange,
  level,
  levelLabel,
  onSubmit,
}: CreateItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {levelLabel}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {level === "contents" ? "Title" : "Name"}
            </Label>
            <Input id="name" name="name" required />
          </div>
          {level === "contents" && <ContentFields />}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContentFields() {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select name="type" defaultValue="Lecture">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Lecture">Lecture</SelectItem>
            <SelectItem value="PDF">PDF</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="videoUrl">Video URL</Label>
        <Input id="videoUrl" name="videoUrl" placeholder="https://..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="videoType">Video Type</Label>
        <Select name="videoType" defaultValue="YOUTUBE">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="YOUTUBE">YouTube</SelectItem>
            <SelectItem value="HLS">HLS</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pdfUrl">PDF URL</Label>
        <Input id="pdfUrl" name="pdfUrl" placeholder="https://..." />
      </div>
    </>
  );
}
