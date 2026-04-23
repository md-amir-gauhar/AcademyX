import { z } from "zod";

// Create Teacher Schema
export const createTeacherSchema = z.object({
  name: z
    .string()
    .min(2, "Teacher name must be at least 2 characters")
    .max(255, "Teacher name must not exceed 255 characters"),
  batchIds: z.array(z.string().uuid("Invalid batch ID")).optional().default([]),
  subjectIds: z
    .array(z.string().uuid("Invalid subject ID"))
    .optional()
    .default([]),
  highlights: z.any().optional(), // JSONB field
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  subjects: z.array(z.string()).optional().default([]),
});

// Update Teacher Schema
export const updateTeacherSchema = z.object({
  name: z
    .string()
    .min(2, "Teacher name must be at least 2 characters")
    .max(255, "Teacher name must not exceed 255 characters")
    .optional(),
  subjectIds: z.array(z.string().uuid("Invalid subject ID")).optional(),
  highlights: z.any().optional(),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  subjects: z.array(z.string()).optional(),
});

// Param schemas
export const teacherIdParamSchema = z.object({
  id: z.string().uuid("Invalid teacher ID"),
});

export const batchIdParamSchema = z.object({
  batchId: z.string().uuid("Invalid batch ID"),
});

export const teacherBatchParamSchema = z.object({
  teacherId: z.string().uuid("Invalid teacher ID"),
  batchId: z.string().uuid("Invalid batch ID"),
});
