"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  Clock,
  Flag,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  useAttempt,
  useSubmitAnswer,
  useSubmitTest,
} from "@/hooks/useTestAttempt";
import type {
  TestAnswer,
  TestAttemptRunner,
  TestQuestion,
  TestSection,
} from "@/types/test";

interface TestEngineProps {
  attemptId: string;
}

export function TestEngine({ attemptId }: TestEngineProps) {
  const router = useRouter();
  const attemptQuery = useAttempt(attemptId);
  const submitAnswerMut = useSubmitAnswer(attemptId);
  const submitTestMut = useSubmitTest();

  const [activeSectionIdx, setActiveSectionIdx] = React.useState(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = React.useState(0);
  const [localAnswers, setLocalAnswers] = React.useState<
    Map<string, { selectedOptionId?: string; isMarkedForReview?: boolean; timeStart: number }>
  >(new Map());
  const [showSubmitDialog, setShowSubmitDialog] = React.useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);
  const questionTimeRef = React.useRef<number>(Date.now());

  const attempt = attemptQuery.data;

  React.useEffect(() => {
    if (!attempt) return;
    const durationMin = attempt.test.durationMinutes ?? attempt.test.duration ?? 180;
    const durationMs = durationMin * 60 * 1000;
    const startedMs = new Date(attempt.startedAt).getTime();
    const endsAt = startedMs + durationMs;
    const remaining = Math.max(0, endsAt - Date.now());
    setTimeLeft(Math.floor(remaining / 1000));
  }, [attempt]);

  React.useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft !== null]);

  React.useEffect(() => {
    if (attempt?.answers) {
      const map = new Map<string, { selectedOptionId?: string; isMarkedForReview?: boolean; timeStart: number }>();
      for (const ans of attempt.answers) {
        map.set(ans.questionId, {
          selectedOptionId: ans.selectedOptionId ?? undefined,
          isMarkedForReview: ans.isMarkedForReview,
          timeStart: Date.now(),
        });
      }
      setLocalAnswers(map);
    }
  }, [attempt?.answers]);

  React.useEffect(() => {
    questionTimeRef.current = Date.now();
  }, [activeQuestionIdx, activeSectionIdx]);

  const handleAutoSubmit = React.useCallback(() => {
    if (!submitTestMut.isPending) {
      submitTestMut.mutate(attemptId, {
        onSuccess: () => router.push(`/tests/report/${attemptId}`),
      });
    }
  }, [attemptId, submitTestMut, router]);

  if (attemptQuery.isLoading) return <EngineLoader />;
  if (!attempt) return <EngineError message="Could not load test attempt." />;

  if (attempt.isCompleted) {
    router.push(`/tests/report/${attemptId}`);
    return <EngineLoader />;
  }

  const sections = attempt.test.sections;
  const currentSection = sections[activeSectionIdx];
  if (!currentSection) return <EngineError message="No sections found." />;

  const currentQuestion = currentSection.questions[activeQuestionIdx];
  if (!currentQuestion) return <EngineError message="No question found." />;

  const localAnswer = localAnswers.get(currentQuestion.id);
  const selectedOptionId = localAnswer?.selectedOptionId;
  const isMarkedForReview = localAnswer?.isMarkedForReview ?? false;

  const allQuestions = sections.flatMap((s) => s.questions);
  const answeredCount = allQuestions.filter((q) => localAnswers.get(q.id)?.selectedOptionId).length;
  const markedCount = allQuestions.filter((q) => localAnswers.get(q.id)?.isMarkedForReview).length;
  const progressPercent = (answeredCount / allQuestions.length) * 100;

  function handleSelectOption(optionId: string) {
    const newSelected = selectedOptionId === optionId ? undefined : optionId;
    const timeTaken = Math.floor((Date.now() - questionTimeRef.current) / 1000);

    setLocalAnswers((prev) => {
      const next = new Map(prev);
      next.set(currentQuestion.id, {
        ...next.get(currentQuestion.id),
        selectedOptionId: newSelected,
        timeStart: Date.now(),
      });
      return next;
    });

    submitAnswerMut.mutate({
      questionId: currentQuestion.id,
      selectedOptionId: newSelected,
      timeSpentSeconds: timeTaken,
      isMarkedForReview,
    });
  }

  function handleToggleReview() {
    const newVal = !isMarkedForReview;
    const timeTaken = Math.floor((Date.now() - questionTimeRef.current) / 1000);

    setLocalAnswers((prev) => {
      const next = new Map(prev);
      next.set(currentQuestion.id, {
        ...next.get(currentQuestion.id),
        isMarkedForReview: newVal,
        timeStart: Date.now(),
      });
      return next;
    });

    submitAnswerMut.mutate({
      questionId: currentQuestion.id,
      selectedOptionId,
      timeSpentSeconds: timeTaken,
      isMarkedForReview: newVal,
    });
  }

  function handleClearResponse() {
    const timeTaken = Math.floor((Date.now() - questionTimeRef.current) / 1000);

    setLocalAnswers((prev) => {
      const next = new Map(prev);
      next.set(currentQuestion.id, {
        ...next.get(currentQuestion.id),
        selectedOptionId: undefined,
        timeStart: Date.now(),
      });
      return next;
    });

    submitAnswerMut.mutate({
      questionId: currentQuestion.id,
      selectedOptionId: undefined,
      timeSpentSeconds: timeTaken,
      isMarkedForReview,
    });
  }

  function navigateToQuestion(sIdx: number, qIdx: number) {
    setActiveSectionIdx(sIdx);
    setActiveQuestionIdx(qIdx);
    setShowSectionDropdown(false);
  }

  function handleNext() {
    if (activeQuestionIdx < currentSection.questions.length - 1) {
      setActiveQuestionIdx((i) => i + 1);
    } else if (activeSectionIdx < sections.length - 1) {
      setActiveSectionIdx((i) => i + 1);
      setActiveQuestionIdx(0);
    }
  }

  function handlePrev() {
    if (activeQuestionIdx > 0) {
      setActiveQuestionIdx((i) => i - 1);
    } else if (activeSectionIdx > 0) {
      const prevSection = sections[activeSectionIdx - 1];
      setActiveSectionIdx((i) => i - 1);
      setActiveQuestionIdx(prevSection.questions.length - 1);
    }
  }

  function getQuestionStatus(qId: string): "answered" | "marked" | "marked-answered" | "unanswered" {
    const a = localAnswers.get(qId);
    if (!a) return "unanswered";
    if (a.selectedOptionId && a.isMarkedForReview) return "marked-answered";
    if (a.isMarkedForReview) return "marked";
    if (a.selectedOptionId) return "answered";
    return "unanswered";
  }

  const isFirst = activeSectionIdx === 0 && activeQuestionIdx === 0;
  const isLast =
    activeSectionIdx === sections.length - 1 &&
    activeQuestionIdx === currentSection.questions.length - 1;

  function handleSubmit() {
    submitTestMut.mutate(attemptId, {
      onSuccess: () => {
        setShowSubmitDialog(false);
        router.push(`/tests/report/${attemptId}`);
      },
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-card px-3 sm:px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold sm:text-base line-clamp-1">
            {attempt.test.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <TimerDisplay seconds={timeLeft ?? 0} />
          <Button
            variant="gradient"
            size="sm"
            onClick={() => setShowSubmitDialog(true)}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Submit Test</span>
          </Button>
        </div>
      </header>

      {/* Section tabs */}
      <div className="relative shrink-0 border-b border-border/60 bg-card">
        {/* Desktop tabs */}
        <div className="hidden sm:flex items-center gap-1 overflow-x-auto px-4 py-2">
          {sections.map((s, idx) => {
            const sectionAnswered = s.questions.filter(
              (q) => localAnswers.get(q.id)?.selectedOptionId
            ).length;
            return (
              <button
                key={s.id}
                onClick={() => { setActiveSectionIdx(idx); setActiveQuestionIdx(0); }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  idx === activeSectionIdx
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                )}
              >
                {s.name}
                <span className="text-xs opacity-70">
                  {sectionAnswered}/{s.questions.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile dropdown */}
        <div className="sm:hidden px-3 py-2">
          <button
            onClick={() => setShowSectionDropdown(!showSectionDropdown)}
            className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2 text-sm font-medium"
          >
            <span>{currentSection.name}</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", showSectionDropdown && "rotate-180")} />
          </button>
          {showSectionDropdown && (
            <div className="absolute left-3 right-3 top-full z-10 mt-1 rounded-lg border border-border/60 bg-card shadow-lg">
              {sections.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => { setActiveSectionIdx(idx); setActiveQuestionIdx(0); setShowSectionDropdown(false); }}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-2.5 text-sm",
                    idx === activeSectionIdx ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent/10"
                  )}
                >
                  {s.name}
                  <span className="text-xs text-muted-foreground">
                    {s.questions.filter((q) => localAnswers.get(q.id)?.selectedOptionId).length}/{s.questions.length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question area */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            {/* Question header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary">
                    Q{activeQuestionIdx + 1}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      currentQuestion.difficulty === "EASY" && "border-green-500/30 text-green-600",
                      currentQuestion.difficulty === "MEDIUM" && "border-yellow-500/30 text-yellow-600",
                      currentQuestion.difficulty === "HARD" && "border-red-500/30 text-red-600"
                    )}
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  +{currentQuestion.marks} marks
                  {currentQuestion.negativeMarks > 0 && (
                    <span className="text-red-500"> | -{currentQuestion.negativeMarks} negative</span>
                  )}
                </p>
              </div>

              <button
                onClick={handleToggleReview}
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

            {/* Question text */}
            <div className="mb-8">
              <p className="text-base leading-relaxed sm:text-lg">
                {currentQuestion.text}
              </p>
              {currentQuestion.imageUrl && (
                <img
                  src={currentQuestion.imageUrl}
                  alt="Question"
                  className="mt-4 max-h-64 rounded-lg border border-border/60"
                />
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedOptionId === opt.id;
                const label = String.fromCharCode(65 + idx);
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
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

            {/* Action buttons */}
            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedOptionId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearResponse}
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
                  onClick={handlePrev}
                  disabled={isFirst}
                  className="gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
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

        {/* Question palette sidebar - desktop */}
        <aside className="hidden w-72 shrink-0 border-l border-border/60 bg-card lg:flex lg:flex-col">
          <div className="border-b border-border/60 p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Progress</p>
            <Progress value={progressPercent} className="mb-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{answeredCount} answered</span>
              <span>{allQuestions.length - answeredCount} remaining</span>
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
                        onClick={() => navigateToQuestion(sIdx, qIdx)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all",
                          isCurrent && "ring-2 ring-primary ring-offset-1 ring-offset-card",
                          status === "answered" && "bg-green-500 text-white",
                          status === "marked" && "bg-amber-500 text-white",
                          status === "marked-answered" && "bg-violet-500 text-white",
                          status === "unanswered" && "bg-muted text-muted-foreground hover:bg-accent/20"
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
      </div>

      {/* Mobile bottom bar */}
      <div className="shrink-0 border-t border-border/60 bg-card p-3 lg:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-green-500 text-[10px] font-bold text-white">
              {answeredCount}
            </span>
            answered
            {markedCount > 0 && (
              <>
                <span className="mx-1">·</span>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-500 text-[10px] font-bold text-white">
                  {markedCount}
                </span>
                marked
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={handlePrev} disabled={isFirst}>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 text-xs font-medium text-muted-foreground">
              {activeQuestionIdx + 1}/{currentSection.questions.length}
            </span>
            <Button variant="outline" size="sm" onClick={handleNext} disabled={isLast}>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Submit confirmation dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Submit Test?
            </DialogTitle>
            <DialogDescription>
              Once submitted, you cannot modify your answers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <Card className="p-3">
                <p className="text-2xl font-bold text-green-600">{answeredCount}</p>
                <p className="text-xs text-muted-foreground">Answered</p>
              </Card>
              <Card className="p-3">
                <p className="text-2xl font-bold text-amber-600">{markedCount}</p>
                <p className="text-xs text-muted-foreground">Marked</p>
              </Card>
              <Card className="p-3">
                <p className="text-2xl font-bold text-muted-foreground">
                  {allQuestions.length - answeredCount}
                </p>
                <p className="text-xs text-muted-foreground">Unanswered</p>
              </Card>
            </div>
            {allQuestions.length - answeredCount > 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                You have {allQuestions.length - answeredCount} unanswered question(s). Are you sure?
              </p>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSubmitDialog(false)}>
              Continue Test
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={handleSubmit}
              disabled={submitTestMut.isPending}
              className="gap-1.5"
            >
              {submitTestMut.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Submit Test
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
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

function PaletteLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-3 w-3 rounded-sm", color)} />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function EngineLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your test...</p>
      </div>
    </div>
  );
}

function EngineError({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    </div>
  );
}
