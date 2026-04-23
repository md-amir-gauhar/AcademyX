import type { BatchTeacher } from "./batch";

export interface Subject {
  id: string;
  batchId: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  teachers?: BatchTeacher[];
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  description?: string | null;
  displayOrder: number;
}

export interface Topic {
  id: string;
  chapterId: string;
  name: string;
  description?: string | null;
  displayOrder: number;
}

export type ContentType = "Lecture" | "PDF" | "Quiz" | "Note" | "Resource";

export interface Content {
  id: string;
  topicId: string;
  organizationId: string;
  title: string;
  description?: string | null;
  displayOrder: number;
  type: ContentType;
  videoUrl?: string | null;
  videoDuration?: number | null;
  thumbnailUrl?: string | null;
  pdfUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentProgress {
  id: string;
  watchedSeconds: number;
  totalDuration: number;
  watchPercentage: number;
  isCompleted: boolean;
  completedAt: string | null;
  watchCount: number;
  lastWatchedAt: string;
}

export interface RecentlyWatchedItem {
  content: Content & {
    topic?: Topic & {
      chapter?: Chapter & {
        subject?: Subject & { batch?: { id: string; name: string } };
      };
    };
  };
  progress: ContentProgress;
}

export interface WatchStats {
  totalVideosWatched: number;
  completedVideosCount: number;
  totalWatchTimeSeconds: number;
  totalWatchTimeFormatted: string;
  averageCompletionRate: number;
}

export interface BatchProgressOverview {
  totalVideos: number;
  completedVideos: number;
  progressPercentage: number;
  totalWatchTimeSeconds: number;
}
