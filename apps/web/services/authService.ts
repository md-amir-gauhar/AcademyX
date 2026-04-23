import axios from "axios";
import { apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { env } from "@/lib/env";
import { toApiError } from "@/lib/api/errors";
import type {
  GetOtpRequest,
  GetOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  RefreshTokenResponse,
} from "@/types/auth";

/**
 * /api/auth/get-otp has a quirky contract:
 *   200 → existing user (success:true)
 *   400 → brand-new user (success:false), OTP is still sent
 * Both outcomes indicate the OTP was dispatched. We normalise here so the
 * caller gets { isExistingUser } without having to catch.
 */
export async function requestOtp(
  payload: GetOtpRequest
): Promise<GetOtpResponse> {
  try {
    const res = await axios.post(
      `${env.apiUrl.replace(/\/$/, "")}/api/auth${"/get-otp"}`,
      payload,
      { validateStatus: (s) => s === 200 || s === 400 }
    );
    return { isExistingUser: Boolean(res.data?.data?.isExistingUser) };
  } catch (err) {
    throw toApiError(err);
  }
}

export function verifyOtp(payload: VerifyOtpRequest) {
  return apiPost<VerifyOtpResponse, VerifyOtpRequest>(
    endpoints.auth.verifyOtp,
    payload
  );
}

export function refreshToken(refreshToken: string) {
  return apiPost<RefreshTokenResponse, { refreshToken: string }>(
    endpoints.auth.refreshToken,
    { refreshToken }
  );
}
