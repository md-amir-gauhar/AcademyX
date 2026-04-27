import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPut, apiPost, apiDelete } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiRequestError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ArrowLeft, ChevronRight, Save, Trash2 } from "lucide-react";
import type { TestQuestion, TestQuestionOption } from "@/types";
import {
  QuestionForm,
  EMPTY_QUESTION,
  type QuestionDraft,
  type QuestionOptionDraft,
} from "./components/question-form";

export function EditQuestionPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<QuestionDraft>(EMPTY_QUESTION);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const questionQuery = useQuery({
    queryKey: ["test-question", questionId],
    queryFn: () =>
      apiGet<TestQuestion>(endpoints.tests.questions.byId(questionId!)),
    enabled: !!questionId,
  });

  useEffect(() => {
    if (questionQuery.data) {
      setDraft(toDraft(questionQuery.data));
    }
  }, [questionQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const original = questionQuery.data;
      if (!original) throw new Error("Question not loaded");

      await apiPut(endpoints.tests.questions.update(questionId!), {
        text: draft.text.trim(),
        type: draft.type,
        difficulty: draft.difficulty,
        marks: draft.marks,
        negativeMarks: draft.negativeMarks ?? 0,
        explanation: draft.explanation?.trim() || undefined,
        displayOrder: original.displayOrder,
      });

      await syncOptions({
        questionId: questionId!,
        original: original.options ?? [],
        current: draft.options,
      });
    },
    onSuccess: () => {
      toast.success("Question updated");
      queryClient.invalidateQueries({ queryKey: ["test-question", questionId] });
      queryClient.invalidateQueries({ queryKey: ["test-questions"] });
      navigate(-1);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to update",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiDelete(endpoints.tests.questions.delete(questionId!)),
    onSuccess: () => {
      toast.success("Question deleted");
      queryClient.invalidateQueries({ queryKey: ["test-questions"] });
      navigate(-1);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to delete",
      ),
  });

  const handleSave = () => {
    const error = validate(draft);
    if (error) {
      toast.error(error);
      return;
    }
    updateMutation.mutate();
  };

  if (questionQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!questionQuery.data) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm font-medium">Question not found</p>
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => navigate(-1)}
        >
          Go back
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
        <button
          onClick={() => navigate(-1)}
          className="hover:text-foreground"
        >
          Test Builder
        </button>
        <ChevronRight className="h-3.5 w-3.5 opacity-50" />
        <span className="font-medium text-foreground">Edit question</span>
      </nav>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Edit question</h1>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back
        </Button>
      </div>

      <QuestionForm value={draft} onChange={setDraft} />

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-3 px-6 py-3">
          <Button
            variant="ghost"
            onClick={() => setConfirmDelete(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete question
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="mr-1.5 h-4 w-4" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete question"
        description="This question will be permanently deleted. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function toDraft(q: TestQuestion): QuestionDraft {
  return {
    id: q.id,
    text: q.text,
    type: q.type,
    difficulty: q.difficulty,
    marks: q.marks,
    negativeMarks: q.negativeMarks ?? 0,
    explanation: q.explanation ?? "",
    options: (q.options ?? [])
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((o) => ({
        id: o.id,
        text: o.text,
        isCorrect: o.isCorrect,
      })),
  };
}

function validate(d: QuestionDraft): string | null {
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

interface SyncOptionsArgs {
  questionId: string;
  original: TestQuestionOption[];
  current: QuestionOptionDraft[];
}

async function syncOptions({
  questionId,
  original,
  current,
}: SyncOptionsArgs) {
  const originalById = new Map(original.map((o) => [o.id, o]));
  const currentIds = new Set(current.map((o) => o.id).filter(Boolean));

  const toDelete = original.filter((o) => !currentIds.has(o.id));
  await Promise.all(
    toDelete.map((o) =>
      apiDelete(endpoints.tests.options.delete(questionId, o.id)),
    ),
  );

  for (let i = 0; i < current.length; i++) {
    const opt = current[i];
    if (!opt.text.trim()) continue;

    if (opt.id && originalById.has(opt.id)) {
      const existing = originalById.get(opt.id)!;
      if (
        existing.text !== opt.text ||
        existing.isCorrect !== opt.isCorrect ||
        existing.displayOrder !== i
      ) {
        await apiPut(endpoints.tests.options.update(questionId, opt.id), {
          text: opt.text.trim(),
          isCorrect: opt.isCorrect,
          displayOrder: i,
        });
      }
    } else {
      await apiPost(endpoints.tests.options.create(questionId), {
        text: opt.text.trim(),
        isCorrect: opt.isCorrect,
        displayOrder: i,
      });
    }
  }
}
