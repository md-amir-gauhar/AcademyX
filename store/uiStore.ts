"use client";

import { create } from "zustand";

interface UIState {
  commandPaletteOpen: boolean;
  mobileNavOpen: boolean;
  sidebarCollapsed: boolean;

  toggleCommandPalette: (open?: boolean) => void;
  toggleMobileNav: (open?: boolean) => void;
  toggleSidebar: (collapsed?: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  commandPaletteOpen: false,
  mobileNavOpen: false,
  sidebarCollapsed: false,

  toggleCommandPalette: (open) =>
    set((s) => ({
      commandPaletteOpen: open ?? !s.commandPaletteOpen,
    })),
  toggleMobileNav: (open) =>
    set((s) => ({ mobileNavOpen: open ?? !s.mobileNavOpen })),
  toggleSidebar: (collapsed) =>
    set((s) => ({ sidebarCollapsed: collapsed ?? !s.sidebarCollapsed })),
}));
