"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useAttempt,
  useSubmitAnswer,
  useSubmitTest,
} from "@/hooks/useTestAttempt";
import { useCountdown } from "./hooks/useCountdown";
import { TestHeader } from "./components/test-header";
import { TestSidebar, type QuestionStatus } from "./components/test-sidebar";
import { QuestionPanel } from "./components/question-panel";
import { SubmitDialog, type SubmitStats } from "./components/submit-dialog";

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
    Map<
      string,
      {
        selectedOptionId?: string;
        isMarkedForReview?: boolean;
        timeStart: number;
      }
    >
  >(new Map());
  const [showSubmitDialog, setShowSubmitDialog] = React.useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = React.useState(false);
  const questionTimeRef = React.useRef<number>(Date.now());

  const attempt = attemptQuery.data;

  const handleAutoSubmit = React.useCallback(() => {
    if (!submitTestMut.isPending) {
      submitTestMut.mutate(attemptId, {
        onSuccess: () => router.push(`/tests/report/${attemptId}`),
      });
    }
  }, [attemptId, submitTestMut, router]);

  const countdownEndTime = React.useMemo(() => {
    if (!attempt) return undefined;
    const durationMin =
      attempt.test.durationMinutes ?? attempt.test.duration ?? 180;
    const durationMs = durationMin * 60 * 1000;
    return new Date(attempt.startedAt).getTime() + durationMs;
  }, [attempt]);

  const { timeLeft } = useCountdown({
    endTime: countdownEndTime,
    onExpire: handleAutoSubmit,
  });

  React.useEffect(() => {
    if (attempt?.answers) {
      const map = new Map<
        string,
        {
          selectedOptionId?: string;
          isMarkedForReview?: boolean;
          timeStart: number;
        }
      >();
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

  React.useEffect(() => {
    if (attempt?.isCompleted) {
      router.push(`/tests/report/${attemptId}`);
    }
  }, [attempt?.isCompleted, attemptId, router]);

  if (attemptQuery.isLoading) return <EngineLoader />;
  if (!attempt) return <EngineError message="Could not load test attempt." />;
  if (attempt.isCompleted) return <EngineLoader />;

  const sections = attempt.test.sections;
  const currentSection = sections[activeSectionIdx];
  if (!currentSection) return <EngineError message="No sections found." />;

  const currentQuestion = currentSection.questions[activeQuestionIdx];
  if (!currentQuestion) return <EngineError message="No question found." />;

  const localAnswer = localAnswers.get(currentQuestion.id);
  const selectedOptionId = localAnswer?.selectedOptionId;
  const isMarkedForReview = localAnswer?.isMarkedForReview ?? false;

  const allQuestions = sections.flatMap((s) => s.questions);
  const answeredCount = allQuestions.filter(
    (q) => localAnswers.get(q.id)?.selectedOptionId
  ).length;
  const markedCount = allQuestions.filter(
    (q) => localAnswers.get(q.id)?.isMarkedForReview
  ).length;

  const sectionAnsweredCounts = sections.map(
    (s) =>
      s.questions.filter((q) => localAnswers.get(q.id)?.selectedOptionId).length
  );

  const isFirst = activeSectionIdx === 0 && activeQuestionIdx === 0;
  const isLast =
    activeSectionIdx === sections.length - 1 &&
    activeQuestionIdx === currentSection.questions.length - 1;

  const submitStats: SubmitStats = {
    answered: answeredCount,
    marked: markedCount,
    unanswered: allQuestions.length - answeredCount,
  };

  function handleSelectOption(optionId: string) {
    const newSelected = selectedOptionId === optionId ? undefined : optionId;
    const timeTaken = Math.floor(
      (Date.now() - questionTimeRef.current) / 1000
    );

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
    const timeTaken = Math.floor(
      (Date.now() - questionTimeRef.current) / 1000
    );

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
    const timeTaken = Math.floor(
      (Date.now() - questionTimeRef.current) / 1000
    );

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

  function handleSectionChange(idx: number) {
    setActiveSectionIdx(idx);
    setActiveQuestionIdx(0);
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

  function getQuestionStatus(qId: string): QuestionStatus {
    const a = localAnswers.get(qId);
    if (!a) return "unanswered";
    if (a.selectedOptionId && a.isMarkedForReview) return "marked-answered";
    if (a.isMarkedForReview) return "marked";
    if (a.selectedOptionId) return "answered";
    return "unanswered";
  }

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
      <TestHeader
        title={attempt.test.title}
        timeLeft={timeLeft}
        sections={sections}
        activeSectionIdx={activeSectionIdx}
        sectionAnsweredCounts={sectionAnsweredCounts}
        showSectionDropdown={showSectionDropdown}
        onSectionChange={handleSectionChange}
        onToggleSectionDropdown={() =>
          setShowSectionDropdown(!showSectionDropdown)
        }
        onCloseSectionDropdown={() => setShowSectionDropdown(false)}
        onSubmitClick={() => setShowSubmitDialog(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <QuestionPanel
          question={currentQuestion}
          questionIndex={activeQuestionIdx}
          selectedOptionId={selectedOptionId}
          isMarkedForReview={isMarkedForReview}
          isFirst={isFirst}
          isLast={isLast}
          onAnswer={handleSelectOption}
          onClearResponse={handleClearResponse}
          onMarkForReview={handleToggleReview}
          onNext={handleNext}
          onPrev={handlePrev}
        />

        <TestSidebar
          sections={sections}
          activeSectionIdx={activeSectionIdx}
          activeQuestionIdx={activeQuestionIdx}
          answeredCount={answeredCount}
          totalCount={allQuestions.length}
          getQuestionStatus={getQuestionStatus}
          onSelectQuestion={navigateToQuestion}
        />
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
                <span className="mx-1">&middot;</span>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-500 text-[10px] font-bold text-white">
                  {markedCount}
                </span>
                marked
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={isFirst}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 text-xs font-medium text-muted-foreground">
              {activeQuestionIdx + 1}/{currentSection.questions.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={isLast}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <SubmitDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        stats={submitStats}
        onConfirm={handleSubmit}
        isPending={submitTestMut.isPending}
      />
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.history.back()}
        >
          Go back
        </Button>
      </div>
    </div>
  );
}
