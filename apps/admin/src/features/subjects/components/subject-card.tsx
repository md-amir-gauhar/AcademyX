import { ChevronRight, FolderOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Subject } from "@/types";

const BORDER_COLORS = [
  "border-l-emerald-500",
  "border-l-sky-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-violet-500",
  "border-l-teal-500",
] as const;

const ICON_BG_COLORS = [
  "bg-emerald-500/10 text-emerald-500",
  "bg-sky-500/10 text-sky-500",
  "bg-amber-500/10 text-amber-500",
  "bg-rose-500/10 text-rose-500",
  "bg-violet-500/10 text-violet-500",
  "bg-teal-500/10 text-teal-500",
] as const;

interface SubjectCardProps {
  subject: Subject;
  index: number;
  onClick: () => void;
  onDelete: () => void;
}

export function SubjectCard({
  subject,
  index,
  onClick,
  onDelete,
}: SubjectCardProps) {
  const borderColor = BORDER_COLORS[index % BORDER_COLORS.length];
  const iconBg = ICON_BG_COLORS[index % ICON_BG_COLORS.length];

  return (
    <div
      className={`group flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 border-l-[3px] ${borderColor} bg-card p-4 transition-all hover:shadow-sm`}
      onClick={onClick}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
      >
        <FolderOpen className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{subject.name}</p>
        <p className="text-[11px] text-muted-foreground">Subject</p>
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
