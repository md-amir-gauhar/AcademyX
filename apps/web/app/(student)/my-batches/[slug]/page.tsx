import type { Metadata } from "next";
import { BatchLearningView } from "@/features/my-batches/batch-learning-view";

export const metadata: Metadata = {
  title: "Batch",
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BatchLearningView slug={slug} />;
}
