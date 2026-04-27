"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAttemptResults } from "@/hooks/useTestAttempt";
import type { TestQuestion } from "@/types/test";
import { ReportSummary } from "./components/report-summary";
import { ReportSectionBreakdown, type SectionStat } from "./components/report-section-breakdown";
import { ReportQuestionList } from "./components/report-question-list";

interface TestReportProps {
  attemptId: string;
}

export function TestReport({ attemptId }: TestReportProps) {
  const router = useRouter();
  const resultsQuery = useAttemptResults(attemptId);
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

  const sectionStats: SectionStat[] = React.useMemo(() => sections.map((section) => {
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

  const allQuestions = React.useMemo(
    () => sections.flatMap((s) => s.questions),
    [sections]
  );

  if (resultsQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your results...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Link
        href="/tests"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to tests
      </Link>

      <ReportSummary result={result} />

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

        <TabsContent value="overview" className="space-y-6 mt-6">
          <ReportSectionBreakdown
            sections={sectionStats}
            answers={answers}
            allQuestions={allQuestions}
          />
        </TabsContent>

        <TabsContent value="solutions" className="space-y-4 mt-6">
          <ReportQuestionList sections={sections} answers={answers} />
        </TabsContent>
      </Tabs>

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
