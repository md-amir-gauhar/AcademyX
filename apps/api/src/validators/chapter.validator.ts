import { z } from "zod";

// Create Chapter Schema
export const createChapterSchema = z.object({
  name: z
    .string()
    .min(2, "Chapter name must be at least 2 characters")
    .max(255, "Chapter name must not exceed 255 characters"),
  subjectId: z.string().uuid("Invalid subject ID"),
  lectureCount: z
    .number()
    .int("Lecture count must be an integer")
    .min(0, "Lecture count cannot be negative")
    .default(0),
  lectureDuration: z
    .string()
    .max(50, "Lecture duration must not exceed 50 characters")
    .optional(),
});

// Update Chapter Schema
export const updateChapterSchema = z.object({
  name: z
    .string()
    .min(2, "Chapter name must be at least 2 characters")
    .max(255, "Chapter name must not exceed 255 characters")
    .optional(),
  lectureCount: z
    .number()
    .int("Lecture count must be an integer")
    .min(0, "Lecture count cannot be negative")
    .optional(),
  lectureDuration: z
    .string()
    .max(50, "Lecture duration must not exceed 50 characters")
    .optional(),
});

// Param schemas
export const subjectIdParamSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID"),
});

export const chapterIdParamSchema = z.object({
  id: z.string().uuid("Invalid chapter ID"),
});
