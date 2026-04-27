import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiRequestError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ArrowLeft, ChevronRight, Plus, Save } from "lucide-react";
import type { Test, TestSection } from "@/types";
import {
  QuestionForm,
  EMPTY_QUESTION,
  type QuestionDraft,
} from "./components/question-form";

export function CreateQuestionsPage() {
  const { testId, sectionId } = useParams<{
    testId: string;
    sectionId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [drafts, setDrafts] = useState<QuestionDraft[]>([
    { ...EMPTY_QUESTION, options: cloneOptions(EMPTY_QUESTION) },
  ]);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);

  const testQuery = useQuery({
    queryKey: ["test-detail", testId],
    queryFn: () => apiGet<Test>(endpoints.tests.byIdentifier(testId!)),
    enabled: !!testId,
  });

  const sectionsQuery = useQuery({
    queryKey: ["test-sections", testId],
    queryFn: () =>
      apiGet<TestSection[]>(endpoints.tests.sections.list(testId!)),
    enabled: !!testId,
  });

  const section = sectionsQuery.data?.find((s) => s.id === sectionId);

  const bulkMutation = useMutation({
    mutationFn: (payload: { questions: ReturnType<typeof toApiQuestion>[] }) =>
      apiPost(endpoints.tests.questions.bulk(sectionId!), payload),
    onSuccess: () => {
      toast.success(
        drafts.length === 1
          ? "Question created"
          : `${drafts.length} questions created`,
      );
      queryClient.invalidateQueries({
        queryKey: ["test-questions", sectionId],
      });
      navigate(`/tests/${testId}/builder`);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError
          ? err.message
          : "Failed to save questions",
      ),
  });

  const updateDraft = (index: number, draft: QuestionDraft) => {
    setDrafts((prev) => prev.map((d, i) => (i === index ? draft : d)));
  };

  const addAnother = () => {
    setDrafts((prev) => [
      ...prev,
      { ...EMPTY_QUESTION, options: cloneOptions(EMPTY_QUESTION) },
    ]);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  const handleSaveAll = () => {
    const errors = drafts
      .map((d, i) => ({ i, error: validateDraft(d) }))
      .filter((x) => x.error);
    if (errors.length) {
      toast.error(`Question ${errors[0].i + 1}: ${errors[0].error}`);
      return;
    }
    bulkMutation.mutate({
      questions: drafts.map((d, i) => toApiQuestion(d, i)),
    });
  };

  if (testQuery.isLoading || sectionsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const test = testQuery.data;
  if (!test || !section) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm font-medium">Section not found</p>
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => navigate(`/tests/${testId}/builder`)}
        >
          Back to test
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-32">
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/tests" className="hover:text-foreground">
          Tests
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-50" />
        <Link
          to={`/tests/${testId}/builder`}
          className="hover:text-foreground"
        >
          {test.title}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-50" />
        <span className="font-medium text-foreground">{section.name}</span>
      </nav>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Add questions to{" "}
            <span className="text-primary">{section.name}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add as many questions as you want. Click{" "}
            <span className="font-medium">Save All</span> when you're done.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/tests/${testId}/builder`)}
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back
        </Button>
      </div>

      <div className="space-y-4">
        {drafts.map((draft, i) => (
          <QuestionForm
            key={i}
            value={draft}
            onChange={(next) => updateDraft(i, next)}
            onRemove={
              drafts.length > 1 ? () => setRemoveIndex(i) : undefined
            }
            index={i}
            removable={drafts.length > 1}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <Button onClick={addAnother} variant="outline" size="lg">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Another Question
        </Button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-3 px-6 py-3">
          <p className="text-sm text-muted-foreground">
            {drafts.length} question{drafts.length !== 1 ? "s" : ""} ready
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/tests/${testId}/builder`)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={bulkMutation.isPending}
            >
              <Save className="mr-1.5 h-4 w-4" />
              {bulkMutation.isPending
                ? "Saving..."
                : `Save ${drafts.length} Question${drafts.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={removeIndex !== null}
        onOpenChange={(open) => !open && setRemoveIndex(null)}
        title="Remove question?"
        description="This question will be discarded. Already-saved questions are not affected."
        confirmLabel="Remove"
        onConfirm={() => {
          if (removeIndex === null) return;
          setDrafts((prev) => prev.filter((_, i) => i !== removeIndex));
          setRemoveIndex(null);
        }}
      />
    </div>
  );
}

function cloneOptions(q: QuestionDraft) {
  return q.options.map((o) => ({ ...o }));
}

function validateDraft(d: QuestionDraft): string | null {
  if (!d.text.trim()) return "Question text is required";
  if (d.marks <= 0) return "Marks must be greater than 0";
  if (d.type === "MCQ" || d.type === "TRUE_FALSE") {
    const filled = d.options.filter((o) => o.text.trim());
    if (filled.length < 2) return "At least 2 options required";
    if (!d.options.some((o) => o.isCorrect))
      return "Mark one option as the correct answer";
  }
  if (
    (d.type === "FILL_BLANK" || d.type === "NUMERICAL") &&
    !d.options[0]?.text?.trim()
  ) {
    return "Provide the expected answer";
  }
  return null;
}

function toApiQuestion(d: QuestionDraft, displayOrder: number) {
  return {
    text: d.text.trim(),
    type: d.type,
    difficulty: d.difficulty,
    marks: d.marks,
    negativeMarks: d.negativeMarks ?? 0,
    explanation: d.explanation?.trim() || undefined,
    displayOrder,
    options:
      d.type === "MCQ" || d.type === "TRUE_FALSE"
        ? d.options
            .filter((o) => o.text.trim())
            .map((o, i) => ({
              text: o.text.trim(),
              isCorrect: o.isCorrect,
              displayOrder: i,
            }))
        : d.type === "FILL_BLANK" || d.type === "NUMERICAL"
          ? [
              {
                text: d.options[0].text.trim(),
                isCorrect: true,
                displayOrder: 0,
              },
            ]
          : [],
  };
}
