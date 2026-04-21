"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Compass,
  CreditCard,
  GraduationCap,
  Home,
  MessagesSquare,
  Settings,
  Sparkles,
  Trophy,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";

const NAV: Array<{
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  soon?: boolean;
}> = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Discover", href: "/discover", icon: Compass, soon: true },
  { label: "My batches", href: "/my-batches", icon: GraduationCap, soon: true },
  { label: "Live classes", href: "/live", icon: Video, soon: true },
  { label: "Tests", href: "/tests", icon: Trophy, soon: true },
  { label: "Practice", href: "/practice", icon: BookOpen, soon: true },
  { label: "Community", href: "/community", icon: MessagesSquare, soon: true },
];

const FOOTER_NAV = [
  { label: "Billing", href: "/billing", icon: CreditCard, soon: true },
  { label: "Settings", href: "/settings", icon: Settings, soon: true },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border/60 bg-background/60 backdrop-blur lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-border/60 px-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="space-y-1">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Learn
          </p>
          {NAV.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
        <div className="space-y-1">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Account
          </p>
          {FOOTER_NAV.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>
      <div className="m-4 rounded-2xl border border-border/60 bg-gradient-brand-soft p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Upgrade to Pro</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Unlock live classes, unlimited AI mentor & full test series.
        </p>
      </div>
    </aside>
  );
}

function NavLink({
  item,
  pathname,
}: {
  item: { label: string; href: string; icon: React.ComponentType<{ className?: string }>; soon?: boolean };
  pathname: string;
}) {
  const active = pathname === item.href;
  return (
    <Link
      href={item.soon ? "#" : item.href}
      aria-disabled={item.soon ? true : undefined}
      className={cn(
        "relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
        active
          ? "bg-gradient-brand text-white shadow-soft"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        item.soon && "pointer-events-none opacity-60"
      )}
    >
      <item.icon className="h-4 w-4" />
      <span className="flex-1">{item.label}</span>
      {item.soon && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Soon
        </span>
      )}
    </Link>
  );
}
