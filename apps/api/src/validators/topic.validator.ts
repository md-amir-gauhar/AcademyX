import { z } from "zod";

// Create Topic Schema
export const createTopicSchema = z.object({
  name: z
    .string()
    .min(2, "Topic name must be at least 2 characters")
    .max(255, "Topic name must not exceed 255 characters"),
  chapterId: z.string().uuid("Invalid chapter ID"),
});

// Update Topic Schema
export const updateTopicSchema = z.object({
  name: z
    .string()
    .min(2, "Topic name must be at least 2 characters")
    .max(255, "Topic name must not exceed 255 characters")
    .optional(),
});

// Param schemas
export const chapterIdParamSchema = z.object({
  chapterId: z.string().uuid("Invalid chapter ID"),
});

export const topicIdParamSchema = z.object({
  id: z.string().uuid("Invalid topic ID"),
});
