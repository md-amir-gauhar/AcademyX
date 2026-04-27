"use client";

import { Clock, ChevronDown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TestSection } from "@/types/test";

interface TestHeaderProps {
  title: string;
  timeLeft: number;
  sections: TestSection[];
  activeSectionIdx: number;
  sectionAnsweredCounts: number[];
  showSectionDropdown: boolean;
  onSectionChange: (idx: number) => void;
  onToggleSectionDropdown: () => void;
  onCloseSectionDropdown: () => void;
  onSubmitClick: () => void;
}

export function TestHeader({
  title,
  timeLeft,
  sections,
  activeSectionIdx,
  sectionAnsweredCounts,
  showSectionDropdown,
  onSectionChange,
  onToggleSectionDropdown,
  onCloseSectionDropdown,
  onSubmitClick,
}: TestHeaderProps) {
  const currentSection = sections[activeSectionIdx];

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-card px-3 sm:px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold sm:text-base line-clamp-1">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <TimerDisplay seconds={timeLeft} />
          <Button
            variant="gradient"
            size="sm"
            onClick={onSubmitClick}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Submit Test</span>
          </Button>
        </div>
      </header>

      <div className="relative shrink-0 border-b border-border/60 bg-card">
        <div className="hidden sm:flex items-center gap-1 overflow-x-auto px-4 py-2">
          {sections.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => onSectionChange(idx)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                idx === activeSectionIdx
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              )}
            >
              {s.name}
              <span className="text-xs opacity-70">
                {sectionAnsweredCounts[idx]}/{s.questions.length}
              </span>
            </button>
          ))}
        </div>

        <div className="sm:hidden px-3 py-2">
          <button
            onClick={onToggleSectionDropdown}
            className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2 text-sm font-medium"
          >
            <span>{currentSection?.name}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                showSectionDropdown && "rotate-180"
              )}
            />
          </button>
          {showSectionDropdown && (
            <div className="absolute left-3 right-3 top-full z-10 mt-1 rounded-lg border border-border/60 bg-card shadow-lg">
              {sections.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onSectionChange(idx);
                    onCloseSectionDropdown();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-2.5 text-sm",
                    idx === activeSectionIdx
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-accent/10"
                  )}
                >
                  {s.name}
                  <span className="text-xs text-muted-foreground">
                    {sectionAnsweredCounts[idx]}/{s.questions.length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function TimerDisplay({ seconds }: { seconds: number }) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const isLow = seconds < 300;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-mono font-semibold tabular-nums",
        isLow
          ? "bg-red-500/10 text-red-600 animate-pulse"
          : "bg-muted text-foreground"
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      {h > 0 && `${h}:`}
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </div>
  );
}
