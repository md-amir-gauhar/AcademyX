"use client";

import { Grid3X3, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";
import { cn } from "@/lib/utils";

type View = "grid" | "list";
type PriceFilter = "all" | "free" | "paid";

interface DiscoverToolbarProps {
  query: string;
  priceFilter: PriceFilter;
  view: View;
  onQueryChange: (query: string) => void;
  onPriceChange: (filter: PriceFilter) => void;
  onViewChange: (view: View) => void;
}

export function DiscoverToolbar({
  query,
  priceFilter,
  view,
  onQueryChange,
  onPriceChange,
  onViewChange,
}: DiscoverToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <SearchInput
        value={query}
        onChange={onQueryChange}
        placeholder="Search courses, mentors, exams…"
        className="lg:max-w-sm"
      />
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card p-1">
          {(["all", "free", "paid"] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPriceChange(p)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                priceFilter === p
                  ? "bg-gradient-brand text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card p-1">
          <Button
            size="icon"
            variant={view === "grid" ? "default" : "ghost"}
            aria-label="Grid view"
            onClick={() => onViewChange("grid")}
            className="h-8 w-8"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={view === "list" ? "default" : "ghost"}
            aria-label="List view"
            onClick={() => onViewChange("list")}
            className="h-8 w-8"
          >
            <LayoutList className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
