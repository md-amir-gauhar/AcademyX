/**
 * Domain-level enums that are safe to share between client and server.
 * Keep these in sync with apps/api/src/db/schema.ts pgEnums.
 */
export const USER_ROLES = ["ADMIN", "TEACHER", "GUEST", "STUDENT"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const EXAMS = [
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
] as const;
export type Exam = (typeof EXAMS)[number];

export const CLASS_LEVELS = ["11", "12", "12+", "Grad"] as const;
export type ClassLevel = (typeof CLASS_LEVELS)[number];

export const GENDERS = [
  "Male",
  "Female",
  "Other",
  "Prefer not to say",
] as const;
export type Gender = (typeof GENDERS)[number];
