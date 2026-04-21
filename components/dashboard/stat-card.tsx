import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "indigo" | "violet" | "emerald" | "amber" | "sky" | "rose";
  loading?: boolean;
  className?: string;
}

const toneBg: Record<string, string> = {
  indigo: "from-indigo-500/15 to-indigo-500/5 text-indigo-500",
  violet: "from-violet-500/15 to-violet-500/5 text-violet-500",
  emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-500",
  amber: "from-amber-500/15 to-amber-500/5 text-amber-600",
  sky: "from-sky-500/15 to-sky-500/5 text-sky-500",
  rose: "from-rose-500/15 to-rose-500/5 text-rose-500",
};

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = "indigo",
  loading,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br",
            toneBg[tone]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {loading ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        )}
        {sublabel && !loading && (
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        )}
      </div>
    </Card>
  );
}
