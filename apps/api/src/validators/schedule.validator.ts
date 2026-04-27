import { z } from "zod";

// Enums
export const scheduleStatusEnum = z.enum([
  "SCHEDULED",
  "LIVE",
  "COMPLETED",
  "CANCELLED",
]);

// Custom YouTube embed URL validator
const youtubeEmbedUrlRegex =
  /^https:\/\/www\.youtube\.com\/embed\/[a-zA-Z0-9_-]+(\?.*)?$/;

export const youtubeEmbedUrl = z
  .string()
  .url("Invalid URL format")
  .refine(
    (url) => youtubeEmbedUrlRegex.test(url),
    "Must be a valid YouTube embed URL (https://www.youtube.com/embed/VIDEO_ID)"
  );

// Create Schedule Schema
// A schedule must have either a YouTube link OR a media job (uploaded video).
export const createScheduleSchema = z
  .object({
    topicId: z.string().uuid("Invalid topic ID"),
    batchId: z.string().uuid("Invalid batch ID"),
    subjectId: z.string().uuid("Invalid subject ID"),
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(255, "Title must not exceed 255 characters"),
    description: z.string().optional(),
    subjectName: z
      .string()
      .min(1, "Subject name is required")
      .max(255, "Subject name must not exceed 255 characters"),
    youtubeLink: youtubeEmbedUrl.optional(),
    mediaJobId: z.string().uuid("Invalid media job ID").optional(),
    scheduledAt: z
      .string()
      .datetime("Invalid date format")
      .or(z.date().transform((d) => d.toISOString()))
      .refine((date) => {
        const scheduledDate = new Date(date);
        const now = new Date();
        return scheduledDate > now;
      }, "Scheduled time must be in the future"),
    duration: z
      .number()
      .int("Duration must be an integer")
      .positive("Duration must be a positive number"),
    teacherId: z.string().uuid("Invalid teacher ID").optional(),
    thumbnailUrl: z
      .string()
      .url("Invalid thumbnail URL")
      .optional()
      .or(z.literal("")),
    notifyBeforeMinutes: z
      .number()
      .int("Notify before minutes must be an integer")
      .min(0, "Cannot be negative")
      .default(30),
    tags: z.array(z.string()).optional(),
  })
  .refine((d) => Boolean(d.youtubeLink) || Boolean(d.mediaJobId), {
    message: "Provide either a YouTube link or an uploaded video",
    path: ["youtubeLink"],
  });

// Update Schedule Schema
export const updateScheduleSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title must not exceed 255 characters")
    .optional(),
  description: z.string().optional(),
  subjectName: z
    .string()
    .min(1, "Subject name is required")
    .max(255, "Subject name must not exceed 255 characters")
    .optional(),
  youtubeLink: youtubeEmbedUrl.optional(),
  mediaJobId: z.string().uuid("Invalid media job ID").optional(),
  scheduledAt: z
    .string()
    .datetime("Invalid date format")
    .or(z.date().transform((d) => d.toISOString()))
    .refine((date) => {
      const scheduledDate = new Date(date);
      const now = new Date();
      return scheduledDate > now;
    }, "Scheduled time must be in the future")
    .optional(),
  duration: z
    .number()
    .int("Duration must be an integer")
    .positive("Duration must be a positive number")
    .optional(),
  teacherId: z.string().uuid("Invalid teacher ID").optional().nullable(),
  thumbnailUrl: z
    .string()
    .url("Invalid thumbnail URL")
    .optional()
    .or(z.literal("")),
  notifyBeforeMinutes: z
    .number()
    .int("Notify before minutes must be an integer")
    .min(0, "Cannot be negative")
    .optional(),
  tags: z.array(z.string()).optional(),
});

// Update Status Schema
export const updateScheduleStatusSchema = z.object({
  status: scheduleStatusEnum,
});

// Query params for filtering
export const scheduleQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, "Page must be at least 1"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val >= 1 && val <= 100, "Limit must be between 1 and 100"),
  status: scheduleStatusEnum.optional(),
  batchId: z.string().uuid("Invalid batch ID").optional(),
  teacherId: z.string().uuid("Invalid teacher ID").optional(),
  date: z.string().date("Invalid date format (YYYY-MM-DD)").optional(),
  upcoming: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

// Param schemas
export const scheduleIdParamSchema = z.object({
  id: z.string().uuid("Invalid schedule ID"),
});

export const topicIdParamSchema = z.object({
  topicId: z.string().uuid("Invalid topic ID"),
});

export const batchIdParamSchema = z.object({
  batchId: z.string().uuid("Invalid batch ID"),
});
