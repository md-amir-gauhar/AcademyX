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

export const CLASS_LEVELS = ["11", "12", "12+", "Grad"] as const;

export type Exam = (typeof EXAMS)[number];
export type ClassLevel = (typeof CLASS_LEVELS)[number];
