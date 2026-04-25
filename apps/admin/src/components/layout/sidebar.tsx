import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  FileText,
  Calendar,
  ClipboardList,
  Settings,
  Database,
  Shield,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Academics",
    items: [
      { to: "/batches", icon: GraduationCap, label: "Batches" },
      { to: "/teachers", icon: Users, label: "Teachers" },
      { to: "/curriculum", icon: BookOpen, label: "Curriculum" },
      { to: "/schedules", icon: Calendar, label: "Schedules" },
    ],
  },
  {
    label: "Assessments",
    items: [
      { to: "/test-series", icon: ClipboardList, label: "Test Series" },
      { to: "/tests", icon: FileText, label: "Tests" },
    ],
  },
  {
    label: "Management",
    items: [
      { to: "/users", icon: Shield, label: "Users" },
      { to: "/uploads", icon: Upload, label: "Uploads" },
      { to: "/cache", icon: Database, label: "Cache" },
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <span className="font-display text-xl italic text-foreground">
            AcademyX
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            "h-8 w-8 text-muted-foreground hover:text-foreground",
            collapsed && "mx-auto",
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6">
            {!collapsed && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.to);

                const link = (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );

                if (collapsed) {
                  return (
                    <li key={item.to}>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    </li>
                  );
                }

                return <li key={item.to}>{link}</li>;
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
