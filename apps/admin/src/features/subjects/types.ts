export type CurriculumLevel =
  | "batches"
  | "subjects"
  | "chapters"
  | "topics"
  | "contents";

export interface CurriculumState {
  level: CurriculumLevel;
  batchId?: string;
  batchName?: string;
  subjectId?: string;
  subjectName?: string;
  chapterId?: string;
  chapterName?: string;
  topicId?: string;
  topicName?: string;
}

export const LEVEL_LABELS: Record<Exclude<CurriculumLevel, "batches">, string> =
  {
    subjects: "Subject",
    chapters: "Chapter",
    topics: "Topic",
    contents: "Content",
  };
