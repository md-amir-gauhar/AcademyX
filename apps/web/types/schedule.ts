export type ScheduleStatus =
  | "SCHEDULED"
  | "LIVE"
  | "COMPLETED"
  | "CANCELLED";

export interface Schedule {
  id: string;
  title: string;
  description?: string | null;
  scheduledAt: string;
  duration: number;
  status: ScheduleStatus;
  notifyBeforeMinutes?: number | null;
  youtubeLink?: string | null;
  /** When set, this is the HLS master.m3u8 URL produced by transcoding an
   * uploaded recording. Players should prefer it over `youtubeLink`. */
  hlsUrl?: string | null;
  mediaJobId?: string | null;
  thumbnailUrl?: string | null;
  tags?: string[] | null;
  batch?: { id: string; name: string } | null;
  subject?: { id: string; name: string } | null;
  topic?: { id: string; name: string } | null;
  teacher?: { id: string; name: string; avatarUrl?: string | null } | null;
  content?: { id: string; title: string } | null;
}

export interface ScheduleQuery {
  page?: number;
  limit?: number;
  status?: ScheduleStatus;
  batchId?: string;
  teacherId?: string;
  date?: string;
  upcoming?: boolean;
}
