"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Eye,
  Flame,
  Loader2,
  RotateCcw,
  Target,
  Trophy,
  X as XIcon,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn, formatDuration } from "@/lib/utils";
import { useAttemptResults, useAttemptSolutions } from "@/hooks/useTestAttempt";
import type {
  TestAnswer,
  TestAttemptResult,
  TestQuestion,
  TestOption,
} from "@/types/test";

interface TestReportProps {
  attemptId: string;
}

export function TestReport({ attemptId }: TestReportProps) {
  const router = useRouter();
  const resultsQuery = useAttemptResults(attemptId);
  const [showSolutions, setShowSolutions] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("overview");

  const result = resultsQuery.data;
  const test = result?.test;
  const answers = result?.answers ?? [];

  // Build sections with questions from the answers data since the API
  // returns sections flat (without nested questions) in the results endpoint.
  const sections = React.useMemo(() => {
    if (!test) return [];
    const rawSections = test.sections ?? [];
    const hasQuestions = rawSections.length > 0 && rawSections[0]?.questions?.length > 0;
    if (hasQuestions) return rawSections;

    const sectionMap = new Map<string, { id: string; name: string; displayOrder: number; questions: TestQuestion[] }>();
    for (const s of rawSections) {
      sectionMap.set(s.id, { ...s, questions: [] });
    }
    for (const ans of answers) {
      if (!ans.question) continue;
      const sId = ans.question.sectionId;
      if (sId && sectionMap.has(sId)) {
        const existing = sectionMap.get(sId)!;
        if (!existing.questions.some((q) => q.id === ans.question.id)) {
          existing.questions.push(ans.question);
        }
      } else if (sId) {
        sectionMap.set(sId, {
          id: sId,
          name: "Section",
          displayOrder: sectionMap.size,
          questions: [ans.question],
        });
      }
    }
    if ([...sectionMap.values()].every((s) => s.questions.length === 0)) {
      const allQs = answers.filter((a) => a.question).map((a) => a.question);
      if (allQs.length === 0) return [];
      return [{ id: "all", name: "All Questions", displayOrder: 0, questions: allQs }];
    }
    return [...sectionMap.values()].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [test, answers]);

  const sectionStats = React.useMemo(() => sections.map((section) => {
    const sectionQuestionIds = new Set(section.questions.map((q) => q.id));
    const sectionAnswers = answers.filter(
      (a) => sectionQuestionIds.has(a.questionId)
    );
    const correct = sectionAnswers.filter((a) => a.isCorrect).length;
    const wrong = sectionAnswers.filter((a) => a.isCorrect === false && !a.isSkipped).length;
    const skipped = section.questions.length - correct - wrong;
    const maxMarks = section.questions.reduce((sum, q) => sum + q.marks, 0);
    const scored = sectionAnswers.reduce((sum, a) => sum + (a.marksAwarded ?? 0), 0);
    return { ...section, correct, wrong, skipped, maxMarks, scored, total: section.questions.length };
  }), [sections, answers]);

  if (resultsQuery.isLoading) return <ReportLoader />;
  if (!result) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <p className="text-muted-foreground">Could not load results.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

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

  // Safe to assert — we returned early above if result is null
  const testData = test!;

  const totalQuestions = (correctCount ?? 0) + (wrongCount ?? 0) + (skippedCount ?? 0);
  const attemptedCount = (correctCount ?? 0) + (wrongCount ?? 0);
  const accuracy = attemptedCount > 0 ? ((correctCount ?? 0) / attemptedCount) * 100 : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Back button */}
      <Link
        href="/tests"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to tests
      </Link>

      {/* Score hero */}
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

            {/* Score circle */}
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

      {/* Quick stats grid */}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="solutions">
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Solutions
          </TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Section breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Section Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sectionStats.map((section) => (
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

          {/* Performance metrics */}
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
                <MetricRow label="Marks from Correct" value={`+${(correctCount ?? 0) * 4}`} />
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

          {/* Difficulty breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Difficulty Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["EASY", "MEDIUM", "HARD"] as const).map((diff) => {
                  const allQs = sections.flatMap((s) => s.questions);
                  const diffQs = allQs.filter((q) => q.difficulty === diff);
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
        </TabsContent>

        {/* Solutions tab */}
        <TabsContent value="solutions" className="space-y-4 mt-6">
          {sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="text-lg">{section.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {section.questions.map((question, qIdx) => {
                  const answer = answers.find((a) => a.questionId === question.id);
                  return (
                    <SolutionItem
                      key={question.id}
                      question={question}
                      answer={answer}
                      index={qIdx}
                    />
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pb-8">
        <Button variant="outline" size="sm" asChild>
          <Link href="/tests">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Tests
          </Link>
        </Button>
        <Button variant="gradient" size="sm" asChild>
          <Link href="/dashboard">
            <BarChart3 className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
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

function SolutionItem({
  question,
  answer,
  index,
}: {
  question: TestQuestion;
  answer?: TestAnswer & { question?: TestQuestion; selectedOption?: TestOption | null };
  index: number;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const isCorrect = answer?.isCorrect;
  const isSkipped = !answer || answer.isSkipped;
  const correctOption = question.options.find((o) => o.isCorrect);

  return (
    <div className={cn(
      "rounded-xl border-2 p-4 transition-colors",
      isCorrect === true && "border-green-500/20 bg-green-50/30 dark:bg-green-950/10",
      isCorrect === false && "border-red-500/20 bg-red-50/30 dark:bg-red-950/10",
      isSkipped && "border-border/60 bg-muted/30"
    )}>
      {/* Question header */}
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

      {/* Options */}
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

      {/* Explanation toggle */}
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

function ReportLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your results...</p>
      </div>
    </div>
  );
}
