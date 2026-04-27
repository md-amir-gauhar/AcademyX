"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TeacherRow } from "@/components/shared/teacher-row";
import { formatDuration } from "@/lib/utils";

interface BatchHeroProps {
  batch: {
    name: string;
    exam?: string | null;
    class?: string | null;
    teachers?: { id: string; name: string; avatar?: string | null }[];
  };
  progress?: {
    progressPercentage: number;
    completedVideos: number;
    totalVideos: number;
    totalWatchTimeSeconds: number;
  } | null;
}

export function BatchHero({ batch, progress }: BatchHeroProps) {
  return (
    <>
      <Link
        href="/my-batches"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> My batches
      </Link>

      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-center">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {batch.exam && <Badge>{batch.exam}</Badge>}
              {batch.class && (
                <Badge variant="outline">Class {batch.class}</Badge>
              )}
              <Badge variant="success">Enrolled</Badge>
            </div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {batch.name}
            </h1>
            {batch.teachers && batch.teachers.length > 0 && (
              <TeacherRow teachers={batch.teachers} max={4} size="md" />
            )}
          </div>
          <Card className="p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Your progress
                </span>
                {progress && (
                  <span className="text-xs font-semibold text-primary">
                    {Math.round(progress.progressPercentage)}%
                  </span>
                )}
              </div>
              <Progress value={progress?.progressPercentage ?? 0} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {progress
                    ? `${progress.completedVideos} / ${progress.totalVideos} lessons`
                    : "Lessons"}
                </span>
                <span>
                  {formatDuration(progress?.totalWatchTimeSeconds ?? 0)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
