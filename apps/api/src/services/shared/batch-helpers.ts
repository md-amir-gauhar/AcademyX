// Shared helper functions for batch services

export { generateSlug } from "./slug";

// Helper function to calculate validity in days
export function calculateValidity(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Helper function to calculate discounted price
export function calculateDiscountedPrice(
  totalPrice: number,
  discountPercentage: number
): number {
  return totalPrice - (totalPrice * discountPercentage) / 100;
}

export interface CreateBatchInput {
  name: string;
  description: any;
  class: "11" | "12" | "12+" | "Grad";
  exam: string;
  imageUrl?: string;
  startDate: Date | string;
  endDate: Date | string;
  language: string;
  totalPrice: number;
  discountPercentage: number;
  faq?: Array<{ title: string; description: string }>;
  organizationId: string;
}

export interface UpdateBatchInput {
  name?: string;
  description?: any;
  class?: "11" | "12" | "12+" | "Grad";
  exam?: string;
  imageUrl?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  language?: string;
  totalPrice?: number;
  discountPercentage?: number;
  faq?: Array<{ title: string; description: string }>;
  status?: "ACTIVE" | "INACTIVE";
}
