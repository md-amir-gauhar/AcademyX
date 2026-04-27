import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Schedule } from "@/types";
import { VideoUploadField } from "./video-upload-field";

interface ScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Schedule | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}

type SourceTab = "youtube" | "upload";

export function ScheduleFormDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
  isPending,
}: ScheduleFormDialogProps) {
  const initialTab: SourceTab =
    editing?.mediaJobId || editing?.hlsUrl ? "upload" : "youtube";
  const [tab, setTab] = useState<SourceTab>(initialTab);
  const [media, setMedia] = useState<{ mediaJobId?: string; hlsUrl?: string }>({
    mediaJobId: editing?.mediaJobId,
    hlsUrl: editing?.hlsUrl,
  });

  // When the dialog opens with a different `editing` record, snap state to it.
  useEffect(() => {
    if (open) {
      setTab(editing?.mediaJobId || editing?.hlsUrl ? "upload" : "youtube");
      setMedia({
        mediaJobId: editing?.mediaJobId,
        hlsUrl: editing?.hlsUrl,
      });
    }
  }, [open, editing]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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

          {/* Source: YouTube link OR uploaded video that auto-transcodes to HLS */}
          <div className="space-y-2">
            <Label>Class video</Label>
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as SourceTab)}
              className="w-full"
            >
              <TabsList className="w-full">
                <TabsTrigger value="youtube" className="flex-1">
                  YouTube link
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex-1">
                  Upload (HLS)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="youtube" className="space-y-1">
                <Input
                  id="youtubeLink"
                  name={tab === "youtube" ? "youtubeLink" : undefined}
                  defaultValue={editing?.youtubeLink ?? ""}
                  placeholder="https://www.youtube.com/embed/VIDEO_ID"
                />
                <p className="text-xs text-muted-foreground">
                  Use the embed URL — open the YouTube video → Share → Embed.
                </p>
              </TabsContent>

              <TabsContent value="upload">
                <VideoUploadField
                  initialMediaJobId={editing?.mediaJobId}
                  initialHlsUrl={editing?.hlsUrl}
                  onChange={setMedia}
                />
                {tab === "upload" && media.mediaJobId && (
                  <input
                    type="hidden"
                    name="mediaJobId"
                    value={media.mediaJobId}
                  />
                )}
                {tab === "upload" && media.hlsUrl && (
                  <input type="hidden" name="hlsUrl" value={media.hlsUrl} />
                )}
              </TabsContent>
            </Tabs>
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
