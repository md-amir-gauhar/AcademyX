import { BookOpen, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Topic } from "@/types";

interface TopicCardProps {
  topic: Topic;
  onClick: () => void;
  onDelete: () => void;
}

export function TopicCard({ topic, onClick, onDelete }: TopicCardProps) {
  return (
    <div
      className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3 transition-all hover:border-amber-500/30 hover:shadow-sm"
      onClick={onClick}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
        <BookOpen className="h-4 w-4 text-amber-500" />
      </div>
      <p className="min-w-0 flex-1 truncate text-sm font-medium">
        {topic.name}
      </p>
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
