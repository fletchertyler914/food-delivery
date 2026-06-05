import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import type { ReactElement } from "react";

import { type ThemeMode, useUiPreferencesStore } from "../features/ui/ui-preferences.store";
import { ContrastIcon, DarkModeIcon, LightModeIcon } from "../lib/icons";

const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  system: "light",
  light: "dark",
  dark: "system"
};

const NEXT_LABEL: Record<ThemeMode, string> = {
  system: "Switch to light mode",
  light: "Switch to dark mode",
  dark: "Use system theme"
};

export function ThemeToggle(): ReactElement {
  const mode = useUiPreferencesStore((state) => state.mode);
  const setMode = useUiPreferencesStore((state) => state.setMode);
  const nextMode = NEXT_MODE[mode];

  const handleClick = (): void => {
    setMode(nextMode);
  };

  return (
    <Tooltip title={NEXT_LABEL[mode]}>
      <IconButton aria-label={NEXT_LABEL[mode]} onClick={handleClick} color="inherit" size="small">
        <ThemeModeIcon mode={mode} />
      </IconButton>
    </Tooltip>
  );
}

function ThemeModeIcon({ mode }: { readonly mode: ThemeMode }): ReactElement {
  switch (mode) {
    case "light":
      return <LightModeIcon fontSize="small" />;
    case "dark":
      return <DarkModeIcon fontSize="small" />;
    default:
      return <ContrastIcon fontSize="small" />;
  }
}
