"use client";

import { cn } from "@/lib/utils";

interface GradientOrbProps {
  className?: string;
  color?: "violet" | "indigo" | "sky" | "emerald" | "rose";
  size?: "sm" | "md" | "lg" | "xl";
}

const colorMap = {
  violet: "from-violet-500/40 via-indigo-500/30 to-transparent",
  indigo: "from-indigo-500/50 via-violet-500/30 to-transparent",
  sky: "from-sky-400/40 via-indigo-400/25 to-transparent",
  emerald: "from-emerald-400/40 via-sky-400/25 to-transparent",
  rose: "from-rose-400/40 via-violet-400/25 to-transparent",
};

const sizeMap = {
  sm: "h-64 w-64",
  md: "h-96 w-96",
  lg: "h-[32rem] w-[32rem]",
  xl: "h-[44rem] w-[44rem]",
};

export function GradientOrb({
  className,
  color = "violet",
  size = "lg",
}: GradientOrbProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full blur-3xl opacity-60",
        "bg-gradient-radial",
        `bg-gradient-to-br ${colorMap[color]}`,
        sizeMap[size],
        className
      )}
    />
  );
}
