import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import type { BatchTeacher } from "@/types/batch";

interface TeacherRowProps {
  teachers: BatchTeacher[];
  max?: number;
  size?: "sm" | "md";
}

export function TeacherRow({ teachers, max = 3, size = "sm" }: TeacherRowProps) {
  if (!teachers?.length) return null;
  const visible = teachers.slice(0, max);
  const overflow = teachers.length - visible.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visible.map((t) => (
          <Avatar
            key={t.id}
            className={size === "md" ? "h-8 w-8 border-2 border-background" : "h-6 w-6 border-2 border-background"}
          >
            {(t.avatarUrl || t.profileImg) && (
              <AvatarImage
                src={(t.avatarUrl ?? t.profileImg) ?? undefined}
                alt={t.name}
              />
            )}
            <AvatarFallback className="text-[10px]">
              {initials(t.name)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="min-w-0 text-xs text-muted-foreground">
        <span className="line-clamp-1">
          {visible.map((t) => t.name).join(", ")}
          {overflow > 0 && ` +${overflow}`}
        </span>
      </div>
    </div>
  );
}
