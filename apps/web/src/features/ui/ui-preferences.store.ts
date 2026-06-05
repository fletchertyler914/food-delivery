import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "system" | "light" | "dark";

export interface UiPreferencesState {
  readonly mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useUiPreferencesStore = create<UiPreferencesState>()(
  persist(
    (set) => ({
      mode: "system",
      setMode: (mode) => {
        set({ mode });
        try {
          localStorage.setItem("fd-color-mode", mode);
        } catch {
          // private browsing / quota — MUI FOUC script may miss sync
        }
      }
    }),
    {
      name: "fd-ui-preferences",
      partialize: (state) => ({ mode: state.mode })
    }
  )
);
