"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { TestAnswer, TestQuestion } from "@/types/test";

export interface SectionStat {
  id: string;
  name: string;
  displayOrder: number;
  questions: TestQuestion[];
  correct: number;
  wrong: number;
  skipped: number;
  maxMarks: number;
  scored: number;
  total: number;
}

interface ReportSectionBreakdownProps {
  sections: SectionStat[];
  answers: TestAnswer[];
  allQuestions: TestQuestion[];
}

export function ReportSectionBreakdown({ sections, answers, allQuestions }: ReportSectionBreakdownProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{section.name}</span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {section.scored > 0 ? "+" : ""}
                  {section.scored}/{section.maxMarks}
                </span>
              </div>
              <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-muted">
                <div
                  className="bg-green-500 transition-all duration-500"
                  style={{ width: `${(section.correct / section.total) * 100}%` }}
                />
                <div
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${(section.wrong / section.total) * 100}%` }}
                />
                <div
                  className="bg-muted-foreground/20 transition-all duration-500"
                  style={{ width: `${(section.skipped / section.total) * 100}%` }}
                />
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  {section.correct} correct
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  {section.wrong} wrong
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  {section.skipped} skipped
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <DifficultyAnalysis allQuestions={allQuestions} answers={answers} />
    </>
  );
}

function DifficultyAnalysis({
  allQuestions,
  answers,
}: {
  allQuestions: TestQuestion[];
  answers: TestAnswer[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Difficulty Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["EASY", "MEDIUM", "HARD"] as const).map((diff) => {
            const diffQs = allQuestions.filter((q) => q.difficulty === diff);
            const diffAnswers = answers.filter((a) =>
              diffQs.some((q) => q.id === a.questionId)
            );
            const correct = diffAnswers.filter((a) => a.isCorrect).length;
            const total = diffQs.length;
            const pct = total > 0 ? (correct / total) * 100 : 0;

            return (
              <div key={diff} className="rounded-xl border border-border/60 p-4 text-center">
                <Badge
                  variant="outline"
                  className={cn(
                    "mb-2",
                    diff === "EASY" && "border-green-500/30 text-green-600",
                    diff === "MEDIUM" && "border-yellow-500/30 text-yellow-600",
                    diff === "HARD" && "border-red-500/30 text-red-600"
                  )}
                >
                  {diff}
                </Badge>
                <p className="text-2xl font-bold tabular-nums">{correct}/{total}</p>
                <Progress value={pct} className="mt-2 h-1.5" />
                <p className="mt-1 text-xs text-muted-foreground">{pct.toFixed(0)}% correct</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
