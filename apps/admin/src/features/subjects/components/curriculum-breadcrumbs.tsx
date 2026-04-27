import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  level: string;
}

interface CurriculumBreadcrumbsProps {
  crumbs: Crumb[];
  onNavigate: (level: string) => void;
}

export function CurriculumBreadcrumbs({
  crumbs,
  onNavigate,
}: CurriculumBreadcrumbsProps) {
  if (crumbs.length <= 1) return null;

  return (
    <nav className="mb-5 flex items-center gap-1 text-sm">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.level} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            )}
            {isLast ? (
              <span className="font-medium text-foreground">
                {crumb.label}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(crumb.level)}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
