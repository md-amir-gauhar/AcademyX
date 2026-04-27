import { Video, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Content } from "@/types";

interface ContentCardProps {
  content: Content;
  index: number;
  onDelete: () => void;
}

export function ContentCard({ content, index, onDelete }: ContentCardProps) {
  const isLecture = content.type === "Lecture";

  return (
    <div className="group flex items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-3 transition-all hover:shadow-sm">
      <span className="w-5 text-center text-xs text-muted-foreground">
        {index + 1}
      </span>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          isLecture ? "bg-primary/10" : "bg-orange-500/10"
        }`}
      >
        {isLecture ? (
          <Video className="h-4 w-4 text-primary" />
        ) : (
          <FileText className="h-4 w-4 text-orange-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {content.title || content.type}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {content.type}
          {content.videoType ? ` · ${content.videoType}` : ""}
          {content.videoDuration ? ` · ${content.videoDuration} min` : ""}
        </p>
      </div>
      <Badge
        variant={isLecture ? "secondary" : "outline"}
        className="shrink-0 text-[10px]"
      >
        {content.type}
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  );
}
