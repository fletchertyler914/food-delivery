# ADR 0009: A small, opinionated web design system

## Status

Accepted — palette values and the dark-mode scope are amended by [ADR 0010](./0010-dark-mode-and-palette.md).

## Context

The SPA shipped with mostly default MUI styles. Pages reinvented page headers, empty states, and status pills locally, which produced visual drift across features (different paddings, different chip shapes, different card shadows, different copy patterns). Reviewers reasonably described the result as "default MUI" — functional, but not deliberate.

We have a strict no-new-deps rule (`AGENTS.md`), so the answer is **not** to swap the UI kit. Instead, we treat the existing MUI primitives as a platform and own the design tokens + a small set of presentational primitives on top of it.

## Decision

1. **Design tokens live in `apps/web/src/theme/theme.ts`.**
   - Inter Variable as the body font (`@fontsource-variable/inter`); all Roboto entries removed.
   - A refined warm palette (tomato primary `#E04E2C`, teal secondary `#0F766E`, off-white `#FAF9F7` background, `#161616` text).
   - A 25-entry Tailwind-inspired soft shadow scale (`elevation[1..24]`).
   - A complete typography scale (h1..h6, subtitle, body, button, caption, overline) with letter-spacing tuned per size.
   - Component default overrides for `MuiButton`, `MuiCard`, `MuiChip`, `MuiPaper`, `MuiOutlinedInput`, `MuiToggleButton`, `MuiAlert`, `MuiDialog`, `MuiTooltip`, `MuiLinearProgress`.

2. **Presentational primitives live in `apps/web/src/components/`.**
   - `PageHeader` (eyebrow + title + description + actions slot).
   - `SectionHeader` (title + description + action slot).
   - `EmptyState` (icon + title + description + CTA, dashed-border container).
   - `StatusBadge` (tinted-pill order status indicator with a leading dot — replaces raw `Chip` usage).
   - `PriceTag` (tabular-num USD price with size + emphasis variants).
   - `CoverImage` (image with deterministic gradient + initials fallback and optional dark overlay for heroes).

3. **Date/ID formatting lives in `apps/web/src/lib/format/`.**
   - `formatDate`, `formatDateTime`, `formatRelative`, and `shortId` are the only places that decide how an order's metadata reads in the UI.

4. **Pages compose primitives, never reinvent them.** Restaurants browse, restaurant menu, meal detail, cart, orders list, order detail, owner dashboard, landing page, login/signup (`AuthShell`), not-found, and route error boundaries all read from the same vocabulary.

## Consequences

- **Positive:** A new feature page is mostly composition: `<PageHeader />`, `<EmptyState />`, a card pattern, a `<StatusBadge />`. Visual drift is structurally hard to introduce.
- **Positive:** The header/footer/heroes feel intentional — a refined warm palette, an Inter typographic voice, soft elevations, and a sticky brand-marked nav.
- **Negative:** A small amount of MUI surface area is "owned" by us via `components.MuiX.styleOverrides`. Future MUI v6/v7 upgrades will require reviewing that block; the trade-off is accepted because it removes per-feature styling drift.
- **Out of scope:** Dark mode, custom icon set, motion/animation system. The current set is intentionally small and must stay that way.
