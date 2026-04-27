"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TestQuestion } from "@/types/test";

interface QuestionPanelProps {
  question: TestQuestion;
  questionIndex: number;
  selectedOptionId: string | undefined;
  isMarkedForReview: boolean;
  isFirst: boolean;
  isLast: boolean;
  onAnswer: (optionId: string) => void;
  onClearResponse: () => void;
  onMarkForReview: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function QuestionPanel({
  question,
  questionIndex,
  selectedOptionId,
  isMarkedForReview,
  isFirst,
  isLast,
  onAnswer,
  onClearResponse,
  onMarkForReview,
  onNext,
  onPrev,
}: QuestionPanelProps) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary">
                Q{questionIndex + 1}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  question.difficulty === "EASY" &&
                    "border-green-500/30 text-green-600",
                  question.difficulty === "MEDIUM" &&
                    "border-yellow-500/30 text-yellow-600",
                  question.difficulty === "HARD" &&
                    "border-red-500/30 text-red-600"
                )}
              >
                {question.difficulty}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              +{question.marks} marks
              {question.negativeMarks > 0 && (
                <span className="text-red-500">
                  {" "}
                  | -{question.negativeMarks} negative
                </span>
              )}
            </p>
          </div>

          <button
            onClick={onMarkForReview}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              isMarkedForReview
                ? "bg-amber-500/10 text-amber-600"
                : "bg-muted text-muted-foreground hover:bg-accent/10"
            )}
          >
            {isMarkedForReview ? (
              <BookmarkCheck className="h-3.5 w-3.5" />
            ) : (
              <Bookmark className="h-3.5 w-3.5" />
            )}
            {isMarkedForReview ? "Marked" : "Mark for review"}
          </button>
        </div>

        <div className="mb-8">
          <p className="text-base leading-relaxed sm:text-lg">
            {question.text}
          </p>
          {question.imageUrl && (
            <img
              src={question.imageUrl}
              alt="Question"
              className="mt-4 max-h-64 rounded-lg border border-border/60"
            />
          )}
        </div>

        <div className="space-y-3">
          {question.options.map((opt, idx) => {
            const isSelected = selectedOptionId === opt.id;
            const label = String.fromCharCode(65 + idx);
            return (
              <button
                key={opt.id}
                onClick={() => onAnswer(opt.id)}
                className={cn(
                  "group flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-glow"
                    : "border-border/60 bg-card hover:border-primary/30 hover:bg-accent/5"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    isSelected
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  )}
                >
                  {isSelected ? <Check className="h-3.5 w-3.5" /> : label}
                </span>
                <span className="text-sm leading-relaxed sm:text-base">
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedOptionId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearResponse}
                className="text-muted-foreground"
              >
                Clear response
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              disabled={isFirst}
              className="gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              disabled={isLast}
              className="gap-1"
            >
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
