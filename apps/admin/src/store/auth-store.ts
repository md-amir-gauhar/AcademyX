import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AdminUser } from "@/types/auth";

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  hydrated: boolean;

  setSession: (payload: { user: AdminUser; token: string }) => void;
  setToken: (token: string) => void;
  logout: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,

      setSession: ({ user, token }) => set({ user, token }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "academyx.admin.auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);

export const selectIsAuthenticated = (s: AuthState) =>
  Boolean(s.token && s.user);
