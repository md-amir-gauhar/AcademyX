import { apiGet, apiPut } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { UpdateProfilePayload, UserProfile } from "@/types/profile";

export const getMyProfile = () => apiGet<UserProfile>(endpoints.profile.me);

export const updateMyProfile = (payload: UpdateProfilePayload) =>
  apiPut<UserProfile, UpdateProfilePayload>(endpoints.profile.me, payload);
