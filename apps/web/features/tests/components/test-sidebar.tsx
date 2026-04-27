"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { TestSection } from "@/types/test";

export type QuestionStatus =
  | "answered"
  | "marked"
  | "marked-answered"
  | "unanswered";

interface TestSidebarProps {
  sections: TestSection[];
  activeSectionIdx: number;
  activeQuestionIdx: number;
  answeredCount: number;
  totalCount: number;
  getQuestionStatus: (questionId: string) => QuestionStatus;
  onSelectQuestion: (sectionIdx: number, questionIdx: number) => void;
}

export function TestSidebar({
  sections,
  activeSectionIdx,
  activeQuestionIdx,
  answeredCount,
  totalCount,
  getQuestionStatus,
  onSelectQuestion,
}: TestSidebarProps) {
  const progressPercent = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  return (
    <aside className="hidden w-72 shrink-0 border-l border-border/60 bg-card lg:flex lg:flex-col">
      <div className="border-b border-border/60 p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Progress
        </p>
        <Progress value={progressPercent} className="mb-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{answeredCount} answered</span>
          <span>{totalCount - answeredCount} remaining</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <PaletteLegend color="bg-green-500" label="Answered" />
          <PaletteLegend color="bg-amber-500" label="Review" />
          <PaletteLegend color="bg-violet-500" label="Review + Ans" />
          <PaletteLegend color="bg-muted" label="Not visited" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {sections.map((s, sIdx) => (
          <div key={s.id} className="mb-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {s.name}
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {s.questions.map((q, qIdx) => {
                const status = getQuestionStatus(q.id);
                const isCurrent =
                  sIdx === activeSectionIdx && qIdx === activeQuestionIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => onSelectQuestion(sIdx, qIdx)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all",
                      isCurrent &&
                        "ring-2 ring-primary ring-offset-1 ring-offset-card",
                      status === "answered" && "bg-green-500 text-white",
                      status === "marked" && "bg-amber-500 text-white",
                      status === "marked-answered" &&
                        "bg-violet-500 text-white",
                      status === "unanswered" &&
                        "bg-muted text-muted-foreground hover:bg-accent/20"
                    )}
                  >
                    {qIdx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function PaletteLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-3 w-3 rounded-sm", color)} />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
