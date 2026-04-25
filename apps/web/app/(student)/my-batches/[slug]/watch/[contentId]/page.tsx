import type { Metadata } from "next";
import { WatchContent } from "@/features/my-batches/watch-content";

export const metadata: Metadata = {
  title: "Watch",
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; contentId: string }>;
}) {
  const { slug, contentId } = await params;
  return <WatchContent slug={slug} contentId={contentId} />;
}
