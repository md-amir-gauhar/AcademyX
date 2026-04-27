"use client";

import { useAuthStore } from "@/store/authStore";

export function useIsAuthed() {
  return useAuthStore((s) => Boolean(s.accessToken && s.user));
}
