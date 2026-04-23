import type { Metadata } from "next";
import { BatchDetail } from "@/features/discover/batch-detail";

export const metadata: Metadata = {
  title: "Batch detail",
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BatchDetail slug={slug} />;
}
