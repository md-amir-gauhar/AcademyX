import type { Metadata } from "next";
import { TestSeriesDetail } from "@/features/tests/test-series-detail";

export const metadata: Metadata = {
  title: "Test series",
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <TestSeriesDetail slug={slug} />;
}
