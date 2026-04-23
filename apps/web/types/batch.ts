export interface BatchTeacher {
  id: string;
  name: string;
  avatarUrl?: string | null;
  profileImg?: string | null;
}

export interface BatchValidity {
  days: number;
  expiresAt: string;
}

export interface Batch {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  class?: string | null;
  exam?: string | null;
  language?: string | null;
  level?: string | null;
  thumbnailUrl?: string | null;
  bannerUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  totalPrice: number;
  discountPercentage: number;
  discountedPrice: number;
  validity?: BatchValidity | null;
  teachers: BatchTeacher[];
  isPurchased: boolean;
  purchasedAt?: string | null;
  expiresAt?: string | null;
  rating?: number | null;
  studentsCount?: number | null;
  lessonsCount?: number | null;
  durationHours?: number | null;
}

export interface CheckoutResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
  batchName: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
}

export interface FreeEnrollResponse {
  success: boolean;
  enrollmentId: string;
  expiresAt: string;
}
