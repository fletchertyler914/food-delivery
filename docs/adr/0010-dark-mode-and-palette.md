# ADR 0010: Dark mode and the Saffron & Espresso palette

## Status

Accepted — amends [ADR 0009](./0009-design-system.md).

## Context

ADR 0009 established the design system and, in its consequences, listed dark
mode as out of scope and pinned a tomato/teal palette (tomato primary
`#E04E2C`, teal secondary `#0F766E`, off-white `#FAF9F7` background). Two things
changed after that ADR was accepted:

- The tomato ramp read as muddy on large brand surfaces (hero, auth panel), and
  the off-white background felt clinical rather than warm.
- A light/dark toggle is table stakes for a polished consumer UI and is cheap to
  support now that MUI v7 ships first-class CSS-variable theming.

ADR 0009 is immutable, so this ADR records the amendment rather than editing it.

## Decision

1. **Repaint to "Saffron & Espresso."** `apps/web/src/theme/theme.ts` now uses
   saffron primary `#EA580C`, teal secondary `#14B8A6`, warm-cream background
   `#FBF7F0`, and `#1C1917` text. The token-driven structure from ADR 0009 is
   unchanged — only the values moved.
2. **Ship light + dark color schemes.** The theme is built with MUI
   `cssVariables` and `colorSchemes`, so both schemes resolve from CSS variables
   without a full re-render. A header toggle cycles **system → light → dark** and
   persists the choice in `localStorage`.
3. **No load flash.** `index.html` paints `background.default` for the active
   scheme before hydration (keyed off a `data-*` attribute set by a tiny inline
   script), and `MuiCssBaseline` themes `<html>` so the overscroll/canvas area
   matches the active scheme.
4. **Brand surfaces stay readable in both schemes.** The lighter teal is the
   canonical `secondary.main`; `secondary.dark` is reserved for teal text on
   light tints; teal info callouts share the `secondaryInfoAlertSx` helper so the
   shade is consistent per scheme.

## Consequences

- **Positive:** A warmer, more intentional brand and a dark mode users expect,
  with no per-feature theming drift (the ADR 0009 token discipline still holds).
- **Negative:** Because `cssVariables` locks `theme.palette.mode` to the default
  scheme, code must not branch on `theme.palette.mode`; use scheme-responsive
  token strings or `alphaToken` instead. This is documented in
  `.cursor/rules/web.mdc`.
- **Out of scope (unchanged from ADR 0009):** custom icon set, motion/animation
  system.
