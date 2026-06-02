"use client";

import { create } from "zustand";

type ThemeMode = "dark" | "dim" | "contrast";

type UiState = {
  sidebarOpen: boolean;
  commandOpen: boolean;
  themeMode: ThemeMode;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCommandOpen: (open: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  commandOpen: false,
  themeMode: "dark",
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setThemeMode: (themeMode) => set({ themeMode }),
}));
