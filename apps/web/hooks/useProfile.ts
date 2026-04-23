"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMyProfile, updateMyProfile } from "@/services/profileService";
import { useAuthStore } from "@/store/authStore";
import type { ApiRequestError } from "@/lib/api/errors";
import type { UpdateProfilePayload, UserProfile } from "@/types/profile";

const PROFILE_KEY = ["profile", "me"] as const;

export function useMyProfile() {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery<UserProfile, ApiRequestError>({
    queryKey: PROFILE_KEY,
    queryFn: getMyProfile,
    enabled: isAuthed,
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation<UserProfile, ApiRequestError, UpdateProfilePayload>({
    mutationFn: updateMyProfile,
    onSuccess: (data) => {
      qc.setQueryData(PROFILE_KEY, data);
      setUser(data);
      toast.success("Profile updated");
    },
    onError: (err) => {
      toast.error(err.message || "Could not update profile");
    },
  });
}
