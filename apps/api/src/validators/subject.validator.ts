import { z } from "zod";

// Create Subject Schema
export const createSubjectSchema = z.object({
  name: z
    .string()
    .min(2, "Subject name must be at least 2 characters")
    .max(255, "Subject name must not exceed 255 characters"),
  batchId: z.string().uuid("Invalid batch ID"),
  thumbnailUrl: z
    .string()
    .url("Invalid thumbnail URL")
    .optional()
    .or(z.literal("")),
});

// Update Subject Schema
export const updateSubjectSchema = z.object({
  name: z
    .string()
    .min(2, "Subject name must be at least 2 characters")
    .max(255, "Subject name must not exceed 255 characters")
    .optional(),
  thumbnailUrl: z
    .string()
    .url("Invalid thumbnail URL")
    .optional()
    .or(z.literal("")),
});

// Param schemas
export const batchIdParamSchema = z.object({
  batchId: z.string().uuid("Invalid batch ID"),
});

export const subjectIdParamSchema = z.object({
  id: z.string().uuid("Invalid subject ID"),
});
