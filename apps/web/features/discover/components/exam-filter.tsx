"use client";

import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamFilterProps {
  exams: string[];
  selected: string | null;
  onExamChange: (exam: string | null) => void;
}

export function ExamFilter({ exams, selected, onExamChange }: ExamFilterProps) {
  if (exams.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Exam
      </span>
      <button
        onClick={() => onExamChange(null)}
        className={cn(
          "rounded-full border px-3 py-1 text-xs transition-colors",
          selected === null
            ? "border-primary bg-primary/10 text-primary"
            : "border-border/60 text-muted-foreground hover:text-foreground"
        )}
      >
        All
      </button>
      {exams.map((e) => (
        <button
          key={e}
          onClick={() => onExamChange(selected === e ? null : e)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            selected === e
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/60 text-muted-foreground hover:text-foreground"
          )}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
