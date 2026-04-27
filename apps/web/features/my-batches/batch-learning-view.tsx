"use client";

import Link from "next/link";
import { BookOpen, Layers, Radio, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { useBatch } from "@/hooks/useBatches";
import { useSubjects } from "@/hooks/useCourse";
import { useSchedulesByBatch } from "@/hooks/useSchedules";
import { getBatchProgress } from "@/services/contentProgressService";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { BatchHero } from "./components/batch-hero";
import {
  CurriculumTree,
  CurriculumTreeSkeleton,
} from "./components/curriculum-tree";
import { LiveClassesSection } from "./components/live-classes-section";
import { LearningViewSkeleton } from "./components/learning-view-skeleton";

interface BatchLearningViewProps {
  slug: string;
}

export function BatchLearningView({ slug }: BatchLearningViewProps) {
  const batchQuery = useBatch(slug);
  const batch = batchQuery.data;
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken));

  const progress = useQuery({
    queryKey: ["batch-progress", batch?.id],
    queryFn: () => getBatchProgress(batch!.id),
    enabled: Boolean(batch?.id && batch?.isPurchased) && isAuthed,
  });

  const subjects = useSubjects(batch?.isPurchased ? batch.id : undefined);
  const schedules = useSchedulesByBatch(
    batch?.isPurchased ? batch.id : undefined
  );

  if (batchQuery.isLoading) return <LearningViewSkeleton />;

  if (!batch) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Batch not found"
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/my-batches">Back to my batches</Link>
          </Button>
        }
      />
    );
  }

  if (!batch.isPurchased) {
    return (
      <EmptyState
        icon={BookOpen}
        title="You're not enrolled in this batch yet"
        description="Head over to the batch detail page to enroll."
        action={
          <Button asChild variant="gradient" size="sm">
            <Link href={`/discover/${batch.slug}`}>View batch</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <BatchHero batch={batch} progress={progress.data} />

      <Tabs defaultValue="curriculum">
        <TabsList>
          <TabsTrigger value="curriculum">
            <Layers className="h-4 w-4" /> Curriculum
          </TabsTrigger>
          <TabsTrigger value="live">
            <Radio className="h-4 w-4" /> Live classes
          </TabsTrigger>
          <TabsTrigger value="tests">
            <Trophy className="h-4 w-4" /> Tests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum">
          {subjects.isLoading ? (
            <CurriculumTreeSkeleton />
          ) : !subjects.data?.length ? (
            <EmptyState
              icon={Layers}
              title="No subjects yet"
              description="Your mentors are preparing the curriculum — check back in a bit."
              compact
            />
          ) : (
            <CurriculumTree
              subjects={subjects.data}
              batchId={batch.id}
              batchSlug={batch.slug}
            />
          )}
        </TabsContent>

        <TabsContent value="live">
          <LiveClassesSection
            schedules={schedules.data}
            isLoading={schedules.isLoading}
          />
        </TabsContent>

        <TabsContent value="tests">
          <EmptyState
            icon={Trophy}
            title="Tests are coming to your batch soon"
            description="Batch-linked tests will appear here. Meanwhile, browse our test series."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/tests">Browse test series</Link>
              </Button>
            }
            compact
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
