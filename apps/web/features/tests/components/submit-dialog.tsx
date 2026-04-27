"use client";

import { AlertTriangle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface SubmitStats {
  answered: number;
  marked: number;
  unanswered: number;
}

interface SubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: SubmitStats;
  onConfirm: () => void;
  isPending: boolean;
}

export function SubmitDialog({
  open,
  onOpenChange,
  stats,
  onConfirm,
  isPending,
}: SubmitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <p className="text-2xl font-bold text-green-600">
                {stats.answered}
              </p>
              <p className="text-xs text-muted-foreground">Answered</p>
            </Card>
            <Card className="p-3">
              <p className="text-2xl font-bold text-amber-600">
                {stats.marked}
              </p>
              <p className="text-xs text-muted-foreground">Marked</p>
            </Card>
            <Card className="p-3">
              <p className="text-2xl font-bold text-muted-foreground">
                {stats.unanswered}
              </p>
              <p className="text-xs text-muted-foreground">Unanswered</p>
            </Card>
          </div>
          {stats.unanswered > 0 && (
            <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
              You have {stats.unanswered} unanswered question(s). Are you sure?
            </p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Continue Test
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={onConfirm}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Submit Test
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
