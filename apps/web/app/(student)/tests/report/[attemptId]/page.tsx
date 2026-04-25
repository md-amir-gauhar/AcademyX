import type { Metadata } from "next";
import { TestReport } from "@/features/tests/test-report";

export const metadata: Metadata = {
  title: "Test Report",
};

export default async function Page({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <TestReport attemptId={attemptId} />;
}
