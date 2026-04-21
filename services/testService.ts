import { apiGet } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { TestDetails, TestPreview } from "@/types/test";

export const getTest = (idOrSlug: string) =>
  apiGet<TestDetails>(endpoints.tests.byIdOrSlug(idOrSlug));

export const getTestPreview = (testId: string) =>
  apiGet<TestPreview>(endpoints.tests.preview(testId));
