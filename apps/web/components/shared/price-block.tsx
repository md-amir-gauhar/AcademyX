import { formatINR, cn } from "@/lib/utils";

interface PriceBlockProps {
  total: number;
  discounted: number;
  discountPercentage?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  isFree?: boolean;
}

export function PriceBlock({
  total,
  discounted,
  discountPercentage,
  className,
  size = "md",
  isFree,
}: PriceBlockProps) {
  const effectivelyFree = isFree || discounted === 0;
  const sizes = {
    sm: { main: "text-base", strike: "text-xs", badge: "text-[10px]" },
    md: { main: "text-lg", strike: "text-xs", badge: "text-[11px]" },
    lg: { main: "text-3xl", strike: "text-sm", badge: "text-xs" },
  } as const;
  const s = sizes[size];

  if (effectivelyFree) {
    return (
      <div className={cn("flex items-baseline gap-2", className)}>
        <span className={cn("font-semibold text-success", s.main)}>Free</span>
        {total > 0 && (
          <span className={cn("text-muted-foreground line-through", s.strike)}>
            {formatINR(total)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("font-semibold tracking-tight", s.main)}>
        {formatINR(discounted)}
      </span>
      {discountPercentage && discountPercentage > 0 ? (
        <>
          <span className={cn("text-muted-foreground line-through", s.strike)}>
            {formatINR(total)}
          </span>
          <span
            className={cn(
              "rounded-full bg-success/15 px-2 py-0.5 font-semibold uppercase tracking-wide text-success",
              s.badge
            )}
          >
            {Math.round(discountPercentage)}% off
          </span>
        </>
      ) : null}
    </div>
  );
}
