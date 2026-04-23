import type { Metadata } from "next";
import { MyBatchesPage } from "@/features/my-batches/my-batches-page";

export const metadata: Metadata = {
  title: "My batches",
};

export default function Page() {
  return <MyBatchesPage />;
}
