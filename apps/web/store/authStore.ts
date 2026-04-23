"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser } from "@/types/auth";

interface PendingLogin {
  countryCode: string;
  phoneNumber: string;
  isExistingUser: boolean;
  organizationId: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  pendingLogin: PendingLogin | null;
  hydrated: boolean;

  setSession: (payload: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  setPendingLogin: (pending: PendingLogin | null) => void;
  logout: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      pendingLogin: null,
      hydrated: false,

      setSession: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken, pendingLogin: null }),
      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
      setPendingLogin: (pending) => set({ pendingLogin: pending }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          pendingLogin: null,
        }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "academyx.auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        pendingLogin: state.pendingLogin,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);

export const selectIsAuthenticated = (s: AuthState) =>
  Boolean(s.accessToken && s.user);
export const selectNeedsProfile = (s: AuthState) =>
  Boolean(s.user && !s.user.username);
