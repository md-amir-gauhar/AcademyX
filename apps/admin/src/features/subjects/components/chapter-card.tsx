import { ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Chapter } from "@/types";

interface ChapterCardProps {
  chapter: Chapter;
  index: number;
  onClick: () => void;
  onDelete: () => void;
}

export function ChapterCard({
  chapter,
  index,
  onClick,
  onDelete,
}: ChapterCardProps) {
  return (
    <div
      className="group flex cursor-pointer items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-3 transition-all hover:border-sky-500/30 hover:shadow-sm"
      onClick={onClick}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sm font-bold text-sky-500">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{chapter.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {chapter.lectureCount} lecture
          {chapter.lectureCount !== 1 ? "s" : ""}
          {chapter.lectureDuration ? ` · ${chapter.lectureDuration}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  );
}
