import type { Metadata } from "next";
import { DiscoverPage } from "@/features/discover/discover-page";

export const metadata: Metadata = {
  title: "Discover",
  description: "Browse every batch and test series on AcademyX.",
};

export default function Page() {
  return <DiscoverPage />;
}
