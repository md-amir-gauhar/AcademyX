"use client";

import * as React from "react";
import {
  Award,
  Check,
  Clock,
  Flame,
  Target,
  Trophy,
  X as XIcon,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDuration } from "@/lib/utils";
import type { TestAttemptResult } from "@/types/test";

interface ReportSummaryProps {
  result: TestAttemptResult;
}

export function ReportSummary({ result }: ReportSummaryProps) {
  const {
    totalScore,
    percentage,
    correctCount,
    wrongCount,
    skippedCount,
    timeSpentSeconds,
    isPassed,
    rank,
    percentile,
  } = result;

  const testData = result.test;
  const totalQuestions = (correctCount ?? 0) + (wrongCount ?? 0) + (skippedCount ?? 0);
  const attemptedCount = (correctCount ?? 0) + (wrongCount ?? 0);
  const accuracy = attemptedCount > 0 ? ((correctCount ?? 0) / attemptedCount) * 100 : 0;

  const correctMarks = result.answers
    .filter((a) => a.isCorrect)
    .reduce((sum, a) => sum + (a.marksAwarded ?? 0), 0);

  return (
    <>
      <Card className="relative overflow-hidden">
        <div className={cn(
          "absolute inset-0 opacity-5",
          isPassed ? "bg-gradient-to-br from-green-500 to-emerald-500" : "bg-gradient-to-br from-orange-500 to-red-500"
        )} />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {testData.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isPassed ? "success" : "outline"} className="text-xs">
                  {isPassed ? "PASSED" : "NOT PASSED"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Attempt #{result.attemptNumber}
                </span>
                {result.submittedAt && (
                  <span className="text-sm text-muted-foreground">
                    · {new Date(result.submittedAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <ScoreCircle
                percentage={Math.max(0, percentage ?? 0)}
                isPassed={!!isPassed}
              />
              <div className="space-y-1 text-right">
                <p className="text-3xl font-bold tabular-nums">
                  {totalScore ?? 0}
                  <span className="text-base font-normal text-muted-foreground">
                    /{testData.totalMarks}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">Total Score</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="Accuracy"
          value={`${accuracy.toFixed(1)}%`}
          color="text-blue-600"
        />
        <StatCard
          icon={<Check className="h-4 w-4" />}
          label="Correct"
          value={String(correctCount ?? 0)}
          color="text-green-600"
        />
        <StatCard
          icon={<XIcon className="h-4 w-4" />}
          label="Wrong"
          value={String(wrongCount ?? 0)}
          color="text-red-600"
        />
        <StatCard
          icon={<Zap className="h-4 w-4" />}
          label="Skipped"
          value={String(skippedCount ?? 0)}
          color="text-muted-foreground"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Time Taken"
          value={formatDuration(timeSpentSeconds ?? 0)}
          color="text-amber-600"
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Rank"
          value={rank ? `#${rank}` : "N/A"}
          color="text-violet-600"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MetricRow label="Questions Attempted" value={`${attemptedCount}/${totalQuestions}`} />
            <MetricRow label="Accuracy Rate" value={`${accuracy.toFixed(1)}%`} />
            <MetricRow label="Avg. Time per Question" value={
              totalQuestions > 0
                ? `${Math.round((timeSpentSeconds ?? 0) / totalQuestions)}s`
                : "N/A"
            } />
            <MetricRow label="Marks from Correct" value={`+${correctMarks}`} />
            <MetricRow label="Marks Lost (Negative)" value={
              wrongCount ? `-${wrongCount}` : "0"
            } />
            <MetricRow label="Net Score" value={String(totalScore ?? 0)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-4 w-4 text-violet-500" />
              Ranking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MetricRow label="Your Rank" value={rank ? `#${rank}` : "N/A"} />
            <MetricRow label="Percentile" value={
              percentile !== null && percentile !== undefined
                ? `${percentile.toFixed(1)}%`
                : "N/A"
            } />
            <MetricRow label="Pass Status" value={isPassed ? "Passed" : "Not Passed"} />
            <MetricRow label="Passing Marks" value={`${testData.passingMarks ?? 0}/${testData.totalMarks}`} />
            <MetricRow label="Your Percentage" value={`${(percentage ?? 0).toFixed(1)}%`} />
            <MetricRow label="Time Taken" value={formatDuration(timeSpentSeconds ?? 0)} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ScoreCircle({ percentage, isPassed }: { percentage: number; isPassed: boolean }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className="relative h-28 w-28">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "transition-all duration-1000 ease-out",
            isPassed ? "stroke-green-500" : "stroke-orange-500"
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className="p-4 text-center">
      <div className={cn("mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted", color)}>
        {icon}
      </div>
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </Card>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
