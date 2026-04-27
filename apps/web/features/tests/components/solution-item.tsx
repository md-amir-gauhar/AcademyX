"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronUp, X as XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TestAnswer, TestQuestion, TestOption } from "@/types/test";

export interface SolutionItemProps {
  question: TestQuestion;
  answer?: TestAnswer & { question?: TestQuestion; selectedOption?: TestOption | null };
  index: number;
}

export function SolutionItem({ question, answer, index }: SolutionItemProps) {
  const [expanded, setExpanded] = React.useState(false);
  const isCorrect = answer?.isCorrect;
  const isSkipped = !answer || answer.isSkipped;

  return (
    <div className={cn(
      "rounded-xl border-2 p-4 transition-colors",
      isCorrect === true && "border-green-500/20 bg-green-50/30 dark:bg-green-950/10",
      isCorrect === false && "border-red-500/20 bg-red-50/30 dark:bg-red-950/10",
      isSkipped && "border-border/60 bg-muted/30"
    )}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className={cn(
            "mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-bold text-white",
            isCorrect === true && "bg-green-500",
            isCorrect === false && "bg-red-500",
            isSkipped && "bg-muted-foreground"
          )}>
            {isCorrect === true ? <Check className="h-3 w-3" /> : isCorrect === false ? <XIcon className="h-3 w-3" /> : index + 1}
          </span>
          <p className="text-sm leading-relaxed">{question.text}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            "text-xs font-semibold tabular-nums",
            (answer?.marksAwarded ?? 0) > 0 && "text-green-600",
            (answer?.marksAwarded ?? 0) < 0 && "text-red-600",
            (answer?.marksAwarded ?? 0) === 0 && "text-muted-foreground"
          )}>
            {(answer?.marksAwarded ?? 0) > 0 ? "+" : ""}
            {answer?.marksAwarded ?? 0}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        {question.options.map((opt, idx) => {
          const isSelected = answer?.selectedOptionId === opt.id;
          const isCorrectOpt = opt.isCorrect;
          const label = String.fromCharCode(65 + idx);

          return (
            <div
              key={opt.id}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                isCorrectOpt && "bg-green-500/10",
                isSelected && !isCorrectOpt && "bg-red-500/10",
                !isSelected && !isCorrectOpt && "bg-transparent"
              )}
            >
              <span className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                isCorrectOpt && "bg-green-500 text-white",
                isSelected && !isCorrectOpt && "bg-red-500 text-white",
                !isSelected && !isCorrectOpt && "bg-muted text-muted-foreground"
              )}>
                {isCorrectOpt ? <Check className="h-3 w-3" /> : isSelected ? <XIcon className="h-3 w-3" /> : label}
              </span>
              <span className={cn(
                isCorrectOpt && "font-medium text-green-700 dark:text-green-400",
                isSelected && !isCorrectOpt && "font-medium text-red-700 dark:text-red-400 line-through"
              )}>
                {opt.text}
              </span>
              {isSelected && (
                <Badge variant="outline" className="ml-auto text-[10px]">Your answer</Badge>
              )}
            </div>
          );
        })}
      </div>

      {question.explanation && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Hide explanation" : "View explanation"}
          </button>
          {expanded && (
            <div className="mt-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground leading-relaxed">
              {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
