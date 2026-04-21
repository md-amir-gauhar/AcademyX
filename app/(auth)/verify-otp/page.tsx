import type { Metadata } from "next";
import { VerifyOtpForm } from "@/features/auth/verify-otp-form";

export const metadata: Metadata = {
  title: "Verify OTP",
};

export default function VerifyOtpPage() {
  return <VerifyOtpForm />;
}
