import type { Metadata } from "next";
import { TestsMarketplace } from "@/features/tests/tests-marketplace";

export const metadata: Metadata = {
  title: "Tests",
};

export default function Page() {
  return <TestsMarketplace />;
}
