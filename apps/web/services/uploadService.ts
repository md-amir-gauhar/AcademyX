import { apiClient } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { endpoints } from "@/lib/api/endpoints";
import type { UploadResponse } from "@/types/upload";
import type { ApiSuccess } from "@/types/api";

export async function uploadImage(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await apiClient.post<ApiSuccess<UploadResponse>>(
      endpoints.upload.image,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data.data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function uploadAvatar(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await apiClient.post<ApiSuccess<UploadResponse>>(
      endpoints.upload.avatar,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data.data;
  } catch (err) {
    throw toApiError(err);
  }
}
