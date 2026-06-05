import { alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";

// MUI v7 detail: with `cssVariables: true`, `theme.palette.X` resolves to the
// *default* color scheme's literal hex value, so styles that read from it are
// locked to that scheme regardless of which one is active. `theme.vars.palette.X`
// is the CSS variable string (e.g. `"var(--mui-palette-primary-main)"`) and
// responds to the active scheme. Use this helper any time a color needs to
// switch between light and dark.
export function paletteVar(theme: Theme): Theme["palette"] {
  const vars = (theme as Theme & { vars?: { palette: Theme["palette"] } }).vars;
  return vars?.palette ?? theme.palette;
}

// MUI v7 limitation: `alpha()` does not accept `var(...)` inputs. To build a
// scheme-aware translucent color we read the auto-generated `*Channel` variable
// (a space-separated `R G B` triplet) and inline it into an `rgba()` value.
//
// Pass dot-paths like `"primary.main"`, `"background.paper"`, `"error.main"`.
export function alphaToken(theme: Theme, token: string, opacity: number): string {
  const [colorKey, shadeKey] = token.split(".");
  if (!colorKey || !shadeKey) {
    throw new Error(`alphaToken: expected "color.shade", got "${token}".`);
  }

  const vars = (theme as Theme & { vars?: { palette: Record<string, Record<string, string>> } })
    .vars;
  const channel = vars?.palette[colorKey]?.[`${shadeKey}Channel`];
  if (channel) {
    return `rgba(${channel} / ${String(opacity)})`;
  }

  const palette = theme.palette as unknown as Record<string, Record<string, string>>;
  const literal = palette[colorKey]?.[shadeKey];
  if (!literal) {
    throw new Error(`alphaToken: unknown token "${token}".`);
  }
  return alpha(literal, opacity);
}

// Canonical "teal / brand-secondary" info callout styling. Cart, Checkout,
// and any future info alerts share this so the teal renders as one shade per
// color scheme. Token strings (`secondary.*`) and `alphaToken` channels both
// resolve through CSS vars, so this stays correct when the scheme toggles.
export function secondaryInfoAlertSx(theme: Theme): Record<string, unknown> {
  return {
    bgcolor: alphaToken(theme, "secondary.main", 0.12),
    color: "secondary.dark",
    border: 1,
    borderColor: alphaToken(theme, "secondary.main", 0.28),
    "& .MuiAlert-icon": { color: "secondary.main" }
  };
}
