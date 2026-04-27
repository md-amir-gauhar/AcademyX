import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Batch } from "@/types";

interface BatchCardProps {
  batch: Batch;
  onClick: () => void;
}

export function BatchCard({ batch, onClick }: BatchCardProps) {
  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-primary/50 hover:shadow-md"
      onClick={onClick}
    >
      <div className="h-1.5 bg-gradient-to-r from-primary/80 to-primary/30" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{batch.name}</h3>
            {batch.description && (
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {batch.description.replace(/<[^>]*>/g, "")}
              </p>
            )}
          </div>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant="secondary">{batch.exam}</Badge>
          <Badge variant="outline">Class {batch.class}</Badge>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {batch.language || "English"}
          </span>
        </div>
      </div>
    </div>
  );
}
