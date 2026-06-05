import { useColorScheme } from "@mui/material/styles";
import { useEffect, type ReactElement } from "react";

import { useUiPreferencesStore } from "../features/ui/ui-preferences.store";

// Mobile browser-chrome tints (iOS toolbar + safe areas). Mirror the
// values in index.html / theme-init.js and theme.background.default.
const THEME_COLOR = { light: "#fbf7f0", dark: "#1a1310" } as const;

function applyThemeColor(scheme: "light" | "dark"): void {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = THEME_COLOR[scheme];
}

// Keeps MUI's active color scheme in sync with the persisted Zustand
// preference. Runs once on mount and whenever the user toggles theme.
export function ColorSchemeBridge(): ReactElement | null {
  const mode = useUiPreferencesStore((state) => state.mode);
  const { setMode, systemMode } = useColorScheme();

  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);

  // Keep the mobile browser-chrome tint following the resolved scheme so
  // toggling theme at runtime doesn't leave a white toolbar/safe area.
  useEffect(() => {
    const resolved = mode === "system" ? (systemMode ?? "light") : mode;
    applyThemeColor(resolved);
  }, [mode, systemMode]);

  return null;
}
