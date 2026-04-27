import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import type { Batch, Subject, Chapter, Topic, Content } from "@/types";
import { BatchCard } from "./batch-card";
import { SubjectCard } from "./subject-card";
import { ChapterCard } from "./chapter-card";
import { TopicCard } from "./topic-card";
import { ContentCard } from "./content-card";

interface ListProps<T> {
  parentName?: string;
  onAdd?: () => void;
  onSelect?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export function BatchList({
  batches,
  onSelect,
}: {
  batches: Batch[];
  onSelect: (batch: Batch) => void;
}) {
  if (batches.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No batches found"
        description="Create batches first from the Batches page"
      />
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {batches.map((batch) => (
        <BatchCard
          key={batch.id}
          batch={batch}
          onClick={() => onSelect(batch)}
        />
      ))}
    </div>
  );
}

export function SubjectList({
  subjects,
  parentName,
  onSelect,
  onDelete,
  onAdd,
}: ListProps<Subject> & { subjects: Subject[] }) {
  if (subjects.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No subjects"
        description={`Add subjects to ${parentName}`}
        action={
          <Button size="sm" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        }
      />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.map((subject, i) => (
        <SubjectCard
          key={subject.id}
          subject={subject}
          index={i}
          onClick={() => onSelect?.(subject)}
          onDelete={() => onDelete?.(subject)}
        />
      ))}
    </div>
  );
}

export function ChapterList({
  chapters,
  parentName,
  onSelect,
  onDelete,
  onAdd,
}: ListProps<Chapter> & { chapters: Chapter[] }) {
  if (chapters.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No chapters"
        description={`Add chapters to ${parentName}`}
        action={
          <Button size="sm" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Chapter
          </Button>
        }
      />
    );
  }
  return (
    <div className="space-y-2">
      {chapters.map((chapter, i) => (
        <ChapterCard
          key={chapter.id}
          chapter={chapter}
          index={i}
          onClick={() => onSelect?.(chapter)}
          onDelete={() => onDelete?.(chapter)}
        />
      ))}
    </div>
  );
}

export function TopicList({
  topics,
  parentName,
  onSelect,
  onDelete,
  onAdd,
}: ListProps<Topic> & { topics: Topic[] }) {
  if (topics.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No topics"
        description={`Add topics to ${parentName}`}
        action={
          <Button size="sm" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Topic
          </Button>
        }
      />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {topics.map((topic) => (
        <TopicCard
          key={topic.id}
          topic={topic}
          onClick={() => onSelect?.(topic)}
          onDelete={() => onDelete?.(topic)}
        />
      ))}
    </div>
  );
}

export function ContentList({
  contents,
  parentName,
  onDelete,
  onAdd,
}: {
  contents: Content[];
  parentName?: string;
  onDelete: (content: Content) => void;
  onAdd: () => void;
}) {
  if (contents.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No content"
        description={`Add content to ${parentName}`}
        action={
          <Button size="sm" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Content
          </Button>
        }
      />
    );
  }
  return (
    <div className="space-y-2">
      {contents.map((content, i) => (
        <ContentCard
          key={content.id}
          content={content}
          index={i}
          onDelete={() => onDelete(content)}
        />
      ))}
    </div>
  );
}
