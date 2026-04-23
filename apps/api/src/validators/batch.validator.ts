import { z } from "zod";

// Enums
export const classEnum = z.enum(["11", "12", "12+", "Grad"]);
export const examEnum = z.enum([
  "JEE",
  "NEET",
  "UPSC",
  "BANK",
  "SSC",
  "GATE",
  "CAT",
  "NDA",
  "CLAT",
  "OTHER",
]);
export const statusEnum = z.enum(["ACTIVE", "INACTIVE"]);

// Create Batch Schema
export const createBatchSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(255, "Name must not exceed 255 characters"),
  description: z.any().optional(), // JSONB field
  class: classEnum,
  exam: examEnum,
  imageUrl: z.url("Invalid image URL").nullable().optional(),
  startDate: z
    .string()
    .datetime("Invalid date format")
    .or(z.date().transform((d) => d.toISOString())),
  endDate: z
    .string()
    .datetime("Invalid date format")
    .or(z.date().transform((d) => d.toISOString())),
  language: z
    .string()
    .min(2, "Language must be at least 2 characters")
    .max(50, "Language must not exceed 50 characters"),
  totalPrice: z.number().positive("Total price must be a positive number"),
  discountPercentage: z
    .number()
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%")
    .default(0),
  faq: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
      })
    )
    .optional(),
  status: statusEnum.default("ACTIVE"),
  teacherId: z.string().uuid("Invalid teacher ID").optional(),
});

// Update Batch Schema (all fields optional)
export const updateBatchSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(255, "Name must not exceed 255 characters")
    .optional(),
  description: z.any().optional(),
  class: classEnum.optional(),
  exam: examEnum.optional(),
  imageUrl: z.string().url("Invalid image URL").nullable().optional(),
  startDate: z
    .string()
    .datetime("Invalid date format")
    .or(z.date().transform((d) => d.toISOString()))
    .optional(),
  endDate: z
    .string()
    .datetime("Invalid date format")
    .or(z.date().transform((d) => d.toISOString()))
    .optional(),
  language: z
    .string()
    .min(2, "Language must be at least 2 characters")
    .max(50, "Language must not exceed 50 characters")
    .optional(),
  totalPrice: z
    .number()
    .positive("Total price must be a positive number")
    .optional(),
  discountPercentage: z
    .number()
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%")
    .optional(),
  faq: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
      })
    )
    .optional(),
  status: statusEnum.optional(),
  teacherId: z.string().uuid("Invalid teacher ID").optional(),
});

// Query params for pagination
export const paginationSchema = z.object({
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
});

// UUID param validation
export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

export const identifierParamSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
});
