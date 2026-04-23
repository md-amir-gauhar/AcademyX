import type { Metadata } from "next";
import { CompleteProfileForm } from "@/features/auth/complete-profile-form";

export const metadata: Metadata = {
  title: "Complete your profile",
};

export default function CompleteProfilePage() {
  return <CompleteProfileForm />;
}
