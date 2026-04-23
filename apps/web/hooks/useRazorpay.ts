"use client";

import * as React from "react";

const RAZORPAY_SDK_SRC = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

/**
 * Lazily injects the Razorpay SDK and returns a helper to open the checkout
 * modal. The SDK script is loaded exactly once per tab.
 */
export function useRazorpay() {
  const [loaded, setLoaded] = React.useState<boolean>(
    typeof window !== "undefined" && Boolean(window.Razorpay)
  );
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (typeof window === "undefined") return false;
    if (window.Razorpay) {
      setLoaded(true);
      return true;
    }
    if (loading) return false;
    setLoading(true);
    return new Promise<boolean>((resolve) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${RAZORPAY_SDK_SRC}"]`
      );
      const script = existing ?? document.createElement("script");
      if (!existing) {
        script.src = RAZORPAY_SDK_SRC;
        script.async = true;
        document.body.appendChild(script);
      }
      script.onload = () => {
        setLoaded(true);
        setLoading(false);
        resolve(true);
      };
      script.onerror = () => {
        setLoading(false);
        resolve(false);
      };
      if (existing && window.Razorpay) {
        setLoaded(true);
        setLoading(false);
        resolve(true);
      }
    });
  }, [loading]);

  const open = React.useCallback(
    async (options: RazorpayOptions) => {
      const ok = await load();
      if (!ok || !window.Razorpay) {
        throw new Error("Could not load payment SDK. Please try again.");
      }
      const rzp = new window.Razorpay(options);
      rzp.open();
    },
    [load]
  );

  return { open, loaded, loading };
}
