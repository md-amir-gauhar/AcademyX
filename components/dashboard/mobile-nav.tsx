"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, GraduationCap, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/my-batches", label: "Learn", icon: GraduationCap },
  { href: "/tests", label: "Tests", icon: Trophy },
  { href: "/settings", label: "You", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-30 grid grid-cols-5 border-t border-border/60 bg-background/90 backdrop-blur-xl lg:hidden">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[11px]",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <t.icon className="h-5 w-5" />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
