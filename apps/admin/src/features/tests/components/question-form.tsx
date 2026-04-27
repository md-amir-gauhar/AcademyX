import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuestionType = "MCQ" | "TRUE_FALSE" | "FILL_BLANK" | "NUMERICAL";
export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface QuestionOptionDraft {
  id?: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionDraft {
  id?: string;
  text: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  marks: number;
  negativeMarks?: number;
  explanation?: string;
  options: QuestionOptionDraft[];
}

export const EMPTY_QUESTION: QuestionDraft = {
  text: "",
  type: "MCQ",
  difficulty: "MEDIUM",
  marks: 1,
  negativeMarks: 0,
  explanation: "",
  options: [
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
};

const TRUE_FALSE_OPTIONS: QuestionOptionDraft[] = [
  { text: "True", isCorrect: false },
  { text: "False", isCorrect: false },
];

interface QuestionFormProps {
  value: QuestionDraft;
  onChange: (next: QuestionDraft) => void;
  onRemove?: () => void;
  index?: number;
  removable?: boolean;
}

export function QuestionForm({
  value,
  onChange,
  onRemove,
  index,
  removable = false,
}: QuestionFormProps) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const update = (patch: Partial<QuestionDraft>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange(next);
  };

  const handleTypeChange = (type: QuestionType) => {
    let options = local.options;
    if (type === "TRUE_FALSE") {
      options = local.options.length === 2 ? local.options : TRUE_FALSE_OPTIONS;
    } else if (type === "MCQ") {
      options =
        local.options.length >= 2
          ? local.options
          : [
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
            ];
    } else {
      options = [];
    }
    update({ type, options });
  };

  const updateOption = (optIndex: number, patch: Partial<QuestionOptionDraft>) => {
    const options = local.options.map((o, i) =>
      i === optIndex ? { ...o, ...patch } : o,
    );
    update({ options });
  };

  const setCorrectOption = (optIndex: number) => {
    const options = local.options.map((o, i) => ({
      ...o,
      isCorrect: i === optIndex,
    }));
    update({ options });
  };

  const addOption = () => {
    update({
      options: [...local.options, { text: "", isCorrect: false }],
    });
  };

  const removeOption = (optIndex: number) => {
    update({
      options: local.options.filter((_, i) => i !== optIndex),
    });
  };

  const showOptions = local.type === "MCQ" || local.type === "TRUE_FALSE";

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <h3 className="text-sm font-semibold">
          {typeof index === "number" ? `Question ${index + 1}` : "Question"}
        </h3>
        {removable && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Remove
          </Button>
        )}
      </div>

      <div className="space-y-5 p-5">
        <div className="space-y-2">
          <Label>Question</Label>
          <Textarea
            value={local.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="Type the question text..."
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={local.type}
              onValueChange={(v) => handleTypeChange(v as QuestionType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MCQ">Multiple Choice</SelectItem>
                <SelectItem value="TRUE_FALSE">True / False</SelectItem>
                <SelectItem value="FILL_BLANK">Fill in the Blank</SelectItem>
                <SelectItem value="NUMERICAL">Numerical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select
              value={local.difficulty}
              onValueChange={(v) =>
                update({ difficulty: v as QuestionDifficulty })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Marks</Label>
              <Input
                type="number"
                min={0}
                step={0.25}
                value={local.marks}
                onChange={(e) => update({ marks: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Negative</Label>
              <Input
                type="number"
                min={0}
                step={0.25}
                value={local.negativeMarks ?? 0}
                onChange={(e) =>
                  update({ negativeMarks: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </div>

        {showOptions && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Options{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (tap the circle to mark the correct answer)
                </span>
              </Label>
              {local.type === "MCQ" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addOption}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Option
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {local.options.map((opt, i) => (
                <OptionRow
                  key={i}
                  option={opt}
                  index={i}
                  canRemove={local.type === "MCQ" && local.options.length > 2}
                  readonlyText={local.type === "TRUE_FALSE"}
                  onTextChange={(text) => updateOption(i, { text })}
                  onSetCorrect={() => setCorrectOption(i)}
                  onRemove={() => removeOption(i)}
                />
              ))}
            </div>
          </div>
        )}

        {local.type === "FILL_BLANK" && (
          <div className="space-y-2">
            <Label>Expected answer</Label>
            <Input
              value={local.options[0]?.text ?? ""}
              onChange={(e) =>
                update({
                  options: [{ text: e.target.value, isCorrect: true }],
                })
              }
              placeholder="The text learners must enter to score correctly"
            />
          </div>
        )}

        {local.type === "NUMERICAL" && (
          <div className="space-y-2">
            <Label>Expected numeric answer</Label>
            <Input
              type="number"
              step="any"
              value={local.options[0]?.text ?? ""}
              onChange={(e) =>
                update({
                  options: [{ text: e.target.value, isCorrect: true }],
                })
              }
              placeholder="e.g. 42"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>
            Explanation{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (shown to learners after they submit)
            </span>
          </Label>
          <Textarea
            value={local.explanation ?? ""}
            onChange={(e) => update({ explanation: e.target.value })}
            rows={2}
            placeholder="Optional — why this is the correct answer"
          />
        </div>
      </div>
    </div>
  );
}

interface OptionRowProps {
  option: QuestionOptionDraft;
  index: number;
  canRemove: boolean;
  readonlyText: boolean;
  onTextChange: (text: string) => void;
  onSetCorrect: () => void;
  onRemove: () => void;
}

function OptionRow({
  option,
  index,
  canRemove,
  readonlyText,
  onTextChange,
  onSetCorrect,
  onRemove,
}: OptionRowProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onSetCorrect}
        title={option.isCorrect ? "Correct answer" : "Mark as correct"}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          option.isCorrect
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-border hover:border-emerald-500/50",
        )}
      >
        {option.isCorrect ? (
          <Check className="h-4 w-4" />
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            {String.fromCharCode(65 + index)}
          </span>
        )}
      </button>
      <Input
        value={option.text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={`Option ${String.fromCharCode(65 + index)}`}
        readOnly={readonlyText}
        className={cn(readonlyText && "bg-muted/40")}
      />
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}
