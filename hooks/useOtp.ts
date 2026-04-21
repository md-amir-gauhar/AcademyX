"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { requestOtp, verifyOtp } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import type {
  GetOtpRequest,
  GetOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "@/types/auth";
import type { ApiRequestError } from "@/lib/api/errors";

export function useRequestOtp() {
  const setPendingLogin = useAuthStore((s) => s.setPendingLogin);

  return useMutation<GetOtpResponse, ApiRequestError, GetOtpRequest>({
    mutationFn: requestOtp,
    onSuccess: (data, variables) => {
      setPendingLogin({
        countryCode: variables.countryCode,
        phoneNumber: variables.phoneNumber,
        organizationId: variables.organizationId,
        isExistingUser: data.isExistingUser,
      });
      toast.success(
        data.isExistingUser
          ? "OTP sent to your registered mobile number"
          : "OTP sent. You'll be registered as a new learner"
      );
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send OTP. Please try again.");
    },
  });
}

export function useVerifyOtp() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation<VerifyOtpResponse, ApiRequestError, VerifyOtpRequest>({
    mutationFn: verifyOtp,
    onSuccess: (data) => {
      setSession(data);
      toast.success("Welcome back!");
    },
    onError: (err) => {
      toast.error(err.message || "Invalid OTP. Try again.");
    },
  });
}
