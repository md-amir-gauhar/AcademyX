export type EntityType = "BATCH" | "TEST_SERIES";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED";

export interface BatchEntityDetails {
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface TestSeriesEntityDetails {
  title: string;
  description?: string | null;
  durationDays?: number | null;
}

export interface Order {
  id: string;
  entityType: EntityType;
  entityId: string;
  amount: number;
  currency: string;
  paymentProvider: string;
  paymentStatus: PaymentStatus;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  providerSignature?: string | null;
  receiptId?: string | null;
  failureReason?: string | null;
  refundId?: string | null;
  refundAmount?: number | null;
  refundedAt?: string | null;
  initiatedAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  createdAt: string;
  entityDetails?: BatchEntityDetails | TestSeriesEntityDetails;
}

export interface VerifyPaymentPayload {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

/** Razorpay order history pagination envelope uses slightly different key names. */
export interface OrderHistoryPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
