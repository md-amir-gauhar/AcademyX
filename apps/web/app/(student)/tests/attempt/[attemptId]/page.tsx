import type { Metadata } from "next";
import { TestEngine } from "@/features/tests/test-engine";

export const metadata: Metadata = {
  title: "Test In Progress",
};

export default async function Page({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <TestEngine attemptId={attemptId} />;
}
