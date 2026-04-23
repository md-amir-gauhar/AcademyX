"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  checkoutBatch,
  enrollFreeBatch,
  verifyPayment,
} from "@/services/batchService";
import {
  checkoutTestSeries,
  enrollFreeTestSeries,
  verifyTestSeriesPayment,
} from "@/services/testSeriesService";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useAuthStore } from "@/store/authStore";
import { env } from "@/lib/env";
import type { ApiRequestError } from "@/lib/api/errors";

type Kind = "BATCH" | "TEST_SERIES";

function invalidationKeys(kind: Kind) {
  return kind === "BATCH"
    ? [["batches"], ["profile", "me"]]
    : [["testSeries"], ["profile", "me"]];
}

export function useFreeEnroll() {
  const qc = useQueryClient();
  return useMutation<
    { enrollmentId: string },
    ApiRequestError,
    { kind: Kind; id: string }
  >({
    mutationFn: async ({ kind, id }) => {
      const res =
        kind === "BATCH"
          ? await enrollFreeBatch(id)
          : await enrollFreeTestSeries(id);
      return { enrollmentId: res.enrollmentId };
    },
    onSuccess: (_, vars) => {
      invalidationKeys(vars.kind).forEach((key) =>
        qc.invalidateQueries({ queryKey: key })
      );
      toast.success(
        vars.kind === "BATCH"
          ? "Enrolled in batch. Happy learning!"
          : "Enrolled in test series."
      );
    },
    onError: (err) => toast.error(err.message || "Enrollment failed."),
  });
}

export interface PaidEnrollArgs {
  kind: Kind;
  id: string;
  entityName: string;
  onSuccess?: () => void;
  onDismiss?: () => void;
}

/**
 * Paid enrollment — full Razorpay handshake:
 *   1. /checkout  → creates our order + RP order, returns key
 *   2. Razorpay modal opens with the tenant's key
 *   3. On payment success → /verify-payment validates the HMAC server-side
 *   4. On verify success → cache invalidation + toast
 */
export function usePaidEnroll() {
  const qc = useQueryClient();
  const razorpay = useRazorpay();
  const user = useAuthStore((s) => s.user);

  return useMutation<{ orderId: string }, ApiRequestError, PaidEnrollArgs>({
    mutationFn: async ({ kind, id, entityName, onSuccess, onDismiss }) => {
      const order =
        kind === "BATCH"
          ? await checkoutBatch(id)
          : await checkoutTestSeries(id);

      return new Promise((resolve, reject) => {
        const verify = async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const body = {
              orderId: order.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            };
            const verified =
              kind === "BATCH"
                ? await verifyPayment(body)
                : await verifyTestSeriesPayment(body);
            if (!verified.success) throw new Error("Payment verification failed");
            invalidationKeys(kind).forEach((key) =>
              qc.invalidateQueries({ queryKey: key })
            );
            toast.success("Payment successful. You're enrolled!");
            onSuccess?.();
            resolve({ orderId: order.orderId });
          } catch (err) {
            const message =
              (err as { message?: string })?.message ||
              "Payment verification failed";
            toast.error(message);
            reject(err as Error);
          }
        };

        razorpay
          .open({
            key: order.key,
            amount: Math.round(order.amount * 100),
            currency: order.currency,
            name: env.appName,
            description: entityName,
            order_id: order.razorpayOrderId,
            prefill: {
              name: user?.username ?? undefined,
              contact: user?.phoneNumber,
            },
            theme: { color: "#6366F1" },
            handler: verify,
            modal: {
              ondismiss: () => {
                onDismiss?.();
                reject(new Error("Payment cancelled"));
              },
            },
          })
          .catch((err) => {
            reject(err as Error);
          });
      });
    },
    onError: (err) => {
      // "Payment cancelled" is user-driven — don't toast that.
      if (err.message !== "Payment cancelled") {
        toast.error(err.message || "Something went wrong with the payment.");
      }
    },
  });
}
