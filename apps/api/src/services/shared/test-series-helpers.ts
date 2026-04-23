// Shared types and helpers for test-series services

export type ExamType =
  | "JEE"
  | "NEET"
  | "UPSC"
  | "BANK"
  | "SSC"
  | "GATE"
  | "CAT"
  | "NDA"
  | "CLAT"
  | "OTHER";

export interface CreateTestSeriesParams {
  organizationId: string;
  exam: ExamType;
  title: string;
  description?: any;
  slug: string;
  imageUrl?: string;
  faq?: any;
  totalPrice: number;
  discountPercentage?: number;
  isFree?: boolean;
  durationDays?: number;
}

export interface UpdateTestSeriesParams {
  exam?: ExamType;
  title?: string;
  description?: any;
  slug?: string;
  imageUrl?: string;
  faq?: any;
  totalPrice?: number;
  discountPercentage?: number;
  isFree?: boolean;
  durationDays?: number;
  status?: "ACTIVE" | "INACTIVE";
  publishedAt?: Date;
}

export function calculateDiscountedPrice(
  totalPrice: number,
  discountPercentage: number
): number {
  return totalPrice - (totalPrice * discountPercentage) / 100;
}
