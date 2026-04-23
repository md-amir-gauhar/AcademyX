import { z } from "zod";

// Enums
export const contentTypeEnum = z.enum(["Lecture", "PDF"]);
export const videoTypeEnum = z.enum(["HLS", "YOUTUBE"]);

// Create Content Schema
export const createContentSchema = z.object({
  name: z
    .string()
    .min(2, "Content name must be at least 2 characters")
    .max(255, "Content name must not exceed 255 characters"),
  topicId: z.string().uuid("Invalid topic ID"),
  type: contentTypeEnum,
  pdfUrl: z.string().url("Invalid PDF URL").optional().or(z.literal("")),
  videoUrl: z.string().url("Invalid video URL").optional().or(z.literal("")),
  videoType: videoTypeEnum.optional(),
  videoThumbnail: z
    .string()
    .url("Invalid thumbnail URL")
    .optional()
    .or(z.literal("")),
  videoDuration: z
    .number()
    .positive("Video duration must be positive")
    .optional(),
  isCompleted: z.boolean().default(false),
});

// Update Content Schema
export const updateContentSchema = z.object({
  name: z
    .string()
    .min(2, "Content name must be at least 2 characters")
    .max(255, "Content name must not exceed 255 characters")
    .optional(),
  type: contentTypeEnum.optional(),
  pdfUrl: z.string().url("Invalid PDF URL").optional().or(z.literal("")),
  videoUrl: z.string().url("Invalid video URL").optional().or(z.literal("")),
  videoType: videoTypeEnum.optional(),
  videoThumbnail: z
    .string()
    .url("Invalid thumbnail URL")
    .optional()
    .or(z.literal("")),
  videoDuration: z
    .number()
    .positive("Video duration must be positive")
    .optional(),
  isCompleted: z.boolean().optional(),
});

// Param schemas
export const topicIdParamSchema = z.object({
  topicId: z.string().uuid("Invalid topic ID"),
});

export const contentIdParamSchema = z.object({
  id: z.string().uuid("Invalid content ID"),
});
