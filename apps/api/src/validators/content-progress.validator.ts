import { z } from "zod";

// Track video progress schema
export const trackProgressSchema = z.object({
  watchedSeconds: z
    .number()
    .int("Watched seconds must be an integer")
    .min(0, "Watched seconds cannot be negative"),
  totalDuration: z
    .number()
    .int("Total duration must be an integer")
    .min(1, "Total duration must be at least 1 second"),
});

// Recently watched query schema
export const recentlyWatchedQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: "Page must be greater than 0" }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val > 0 && val <= 50, {
      message: "Limit must be between 1 and 50",
    }),
  batchId: z.string().uuid("Invalid batch ID").optional(),
  completedOnly: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .pipe(z.boolean()),
});

// Batch progress query schema
export const batchProgressQuerySchema = z.object({
  batchId: z.string().uuid("Invalid batch ID"),
});

// Content ID param schema
export const contentIdParamSchema = z.object({
  contentId: z.string().uuid("Invalid content ID"),
});
