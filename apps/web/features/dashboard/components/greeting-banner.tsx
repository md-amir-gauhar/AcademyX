"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GreetingBannerProps {
  userName: string;
}

export function GreetingBanner({ userName }: GreetingBannerProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        <h1 className="mt-1 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome back,{" "}
          <span className="gradient-text">{userName}</span> 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Let&apos;s keep the streak alive. Here&apos;s what&apos;s waiting for
          you today.
        </p>
      </div>
      <Button asChild variant="gradient" size="lg">
        <Link href="/discover">
          <Sparkles className="h-4 w-4" /> Explore new courses
        </Link>
      </Button>
    </div>
  );
}
