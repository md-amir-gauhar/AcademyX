import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  GraduationCap,
  Users,
  Calendar,
  ClipboardList,
} from "lucide-react";

const links = [
  { label: "New Batch", href: "/batches", icon: GraduationCap },
  { label: "Add Teacher", href: "/teachers", icon: Users },
  { label: "Schedule Class", href: "/schedules", icon: Calendar },
  { label: "Create Test", href: "/test-series", icon: ClipboardList },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {links.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-lg border border-border/50 p-3 text-sm transition-colors hover:bg-accent"
            >
              <item.icon className="h-4 w-4 text-primary" />
              {item.label}
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
