import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPut, apiDelete } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiRequestError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  Check,
  X,
  CircleHelp,
} from "lucide-react";
import type { TestQuestion, TestSection } from "@/types";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  section: TestSection;
  testId: string;
  onDeleted: () => void;
}

const DIFFICULTY_TONE: Record<string, string> = {
  EASY: "bg-emerald-500/10 text-emerald-600",
  MEDIUM: "bg-amber-500/10 text-amber-600",
  HARD: "bg-rose-500/10 text-rose-600",
};

export function SectionCard({ section, testId, onDeleted }: SectionCardProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(section.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const questionsQuery = useQuery({
    queryKey: ["test-questions", section.id],
    queryFn: () =>
      apiGet<TestQuestion[]>(endpoints.tests.questions.list(section.id)),
    enabled: open,
  });

  const updateMutation = useMutation({
    mutationFn: (body: { name: string }) =>
      apiPut(endpoints.tests.sections.update(section.id), body),
    onSuccess: () => {
      toast.success("Section renamed");
      queryClient.invalidateQueries({ queryKey: ["test-sections", testId] });
      setEditingName(false);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to update",
      ),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: () => apiDelete(endpoints.tests.sections.delete(section.id)),
    onSuccess: () => {
      toast.success("Section deleted");
      onDeleted();
      setConfirmDelete(false);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to delete",
      ),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) =>
      apiDelete(endpoints.tests.questions.delete(questionId)),
    onSuccess: () => {
      toast.success("Question deleted");
      queryClient.invalidateQueries({
        queryKey: ["test-questions", section.id],
      });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to delete",
      ),
  });

  const questions = questionsQuery.data ?? [];

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-muted-foreground hover:text-foreground"
          >
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {editingName ? (
            <div className="flex flex-1 items-center gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 max-w-xs"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => updateMutation.mutate({ name })}
                disabled={updateMutation.isPending || !name.trim()}
              >
                <Check className="h-4 w-4 text-emerald-500" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => {
                  setName(section.name);
                  setEditingName(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <h3 className="flex-1 truncate text-sm font-semibold">
                {section.name}
              </h3>
              <Badge variant="secondary" className="shrink-0">
                {questions.length} question{questions.length !== 1 ? "s" : ""}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditingName(true)}
                title="Rename section"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setConfirmDelete(true)}
                title="Delete section"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </>
          )}
        </div>

        {open && (
          <div className="border-t border-border/60 bg-muted/20 p-4">
            {questionsQuery.isLoading ? (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : questions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
                <CircleHelp className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium">No questions yet</p>
                <p className="text-xs text-muted-foreground">
                  Add questions one at a time or in a batch
                </p>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    navigate(
                      `/tests/${testId}/sections/${section.id}/questions/new`,
                    )
                  }
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Questions
                </Button>
              </div>
            ) : (
              <>
                <ul className="space-y-2">
                  {questions.map((q, i) => (
                    <QuestionRow
                      key={q.id}
                      question={q}
                      index={i}
                      onEdit={() => navigate(`/tests/questions/${q.id}/edit`)}
                      onDelete={() => deleteQuestionMutation.mutate(q.id)}
                    />
                  ))}
                </ul>
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigate(
                        `/tests/${testId}/sections/${section.id}/questions/new`,
                      )
                    }
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add More Questions
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete section"
        description={`Delete "${section.name}" and all its questions? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => deleteSectionMutation.mutate()}
        loading={deleteSectionMutation.isPending}
      />
    </>
  );
}

interface QuestionRowProps {
  question: TestQuestion;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

function QuestionRow({ question, index, onEdit, onDelete }: QuestionRowProps) {
  return (
    <li
      className="group flex items-start gap-3 rounded-lg border border-border/60 bg-background p-3 transition-colors hover:border-border"
    >
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
        {index + 1}
      </span>
      <button
        onClick={onEdit}
        className="min-w-0 flex-1 text-left"
        title="Click to edit"
      >
        <p className="line-clamp-2 text-sm font-medium">{question.text}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">
            {readableType(question.type)}
          </Badge>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              DIFFICULTY_TONE[question.difficulty],
            )}
          >
            {question.difficulty}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {question.marks} mark{question.marks !== 1 ? "s" : ""}
            {question.negativeMarks ? ` · -${question.negativeMarks}` : ""}
          </span>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </li>
  );
}

function readableType(type: string) {
  switch (type) {
    case "MCQ":
      return "Multiple Choice";
    case "TRUE_FALSE":
      return "True / False";
    case "FILL_BLANK":
      return "Fill in the Blank";
    case "NUMERICAL":
      return "Numerical";
    default:
      return type;
  }
}
