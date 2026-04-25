"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { VideoPlayer } from "@/components/shared/video-player";
import { EmptyState } from "@/components/shared/empty-state";
import { useContent, useContents } from "@/hooks/useCourse";
import { useBatch } from "@/hooks/useBatches";
import { trackProgress, markComplete } from "@/services/contentProgressService";
import { cn, formatDuration } from "@/lib/utils";

interface WatchContentProps {
  slug: string;
  contentId: string;
}

export function WatchContent({ slug, contentId }: WatchContentProps) {
  const batchQuery = useBatch(slug);
  const contentQuery = useContent(contentId);
  const content = contentQuery.data;

  const siblingContents = useContents(content?.topicId);

  const [watchedSeconds, setWatchedSeconds] = React.useState(0);
  const [totalDuration, setTotalDuration] = React.useState(0);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const lastTrackRef = React.useRef(0);

  const handleProgress = React.useCallback(
    (state: { played: number; playedSeconds: number }) => {
      setWatchedSeconds(Math.floor(state.playedSeconds));

      if (totalDuration > 0 && state.playedSeconds - lastTrackRef.current >= 15) {
        lastTrackRef.current = state.playedSeconds;
        trackProgress(contentId, {
          watchedSeconds: Math.floor(state.playedSeconds),
          totalDuration: Math.floor(totalDuration),
        }).catch(() => {});
      }
    },
    [contentId, totalDuration]
  );

  const handleDuration = React.useCallback((d: number) => {
    setTotalDuration(d);
  }, []);

  const handleEnded = React.useCallback(() => {
    if (!isCompleted) {
      setIsCompleted(true);
      markComplete(contentId).catch(() => {});
    }
  }, [contentId, isCompleted]);

  if (contentQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!content) {
    return (
      <EmptyState
        icon={PlayCircle}
        title="Content not found"
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={`/my-batches/${slug}`}>Back to batch</Link>
          </Button>
        }
      />
    );
  }

  const videoUrl = content.videoUrl;
  const isVideo = content.type === "Lecture" && videoUrl;
  const progressPct = totalDuration > 0 ? (watchedSeconds / totalDuration) * 100 : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Back link */}
      <Link
        href={`/my-batches/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {batchQuery.data?.name ?? "Back to batch"}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div className="space-y-4">
          {isVideo ? (
            <VideoPlayer
              url={videoUrl}
              title={content.title || content.name}
              thumbnail={content.thumbnailUrl || content.videoThumbnail}
              onProgress={handleProgress}
              onDuration={handleDuration}
              onEnded={handleEnded}
              autoPlay
            />
          ) : content.type === "PDF" && content.pdfUrl ? (
            <Card className="flex aspect-video items-center justify-center bg-muted/30">
              <div className="flex flex-col items-center gap-3 text-center">
                <FileText className="h-12 w-12 text-rose-500" />
                <p className="text-sm font-medium">{content.title || content.name}</p>
                <Button asChild variant="gradient" size="sm">
                  <a href={content.pdfUrl} target="_blank" rel="noreferrer">
                    Open PDF
                  </a>
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="flex aspect-video items-center justify-center bg-muted/30">
              <p className="text-sm text-muted-foreground">No playable content</p>
            </Card>
          )}

          {/* Content info */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {content.title || content.name}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">
                    {content.type}
                  </Badge>
                  {totalDuration > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDuration(totalDuration)}
                    </span>
                  )}
                  {isCompleted && (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Completed
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {isVideo && totalDuration > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDuration(watchedSeconds)}</span>
                  <span>{formatDuration(totalDuration)}</span>
                </div>
                <Progress value={Math.min(progressPct, 100)} className="h-1.5" />
              </div>
            )}

            {content.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {content.description}
              </p>
            )}
          </div>
        </div>

        {/* Sidebar — related lessons */}
        <aside className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            In this topic
          </h3>
          {siblingContents.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : siblingContents.data?.length ? (
            <div className="space-y-1.5">
              {siblingContents.data.map((c) => {
                const isCurrent = c.id === contentId;
                return (
                  <Link
                    key={c.id}
                    href={`/my-batches/${slug}/watch/${c.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                      isCurrent
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {c.type === "Lecture" ? (
                      <PlayCircle className="h-4 w-4 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0" />
                    )}
                    <span className="flex-1 line-clamp-2">{c.title || c.name}</span>
                    {isCurrent && (
                      <Badge className="text-[9px]">Now</Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No other lessons.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
