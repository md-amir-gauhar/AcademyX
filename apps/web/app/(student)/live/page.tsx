import type { Metadata } from "next";
import { LivePage } from "@/features/live/live-page";

export const metadata: Metadata = {
  title: "Live classes",
};

export default function Page() {
  return <LivePage />;
}
