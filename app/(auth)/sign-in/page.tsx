import type { Metadata } from "next";
import { SignInForm } from "@/features/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in with your mobile number to continue.",
};

export default function SignInPage() {
  return <SignInForm />;
}
