// Deterministic visual fallbacks when `imageUrl` is absent. The hash
// is stable across renders so the same restaurant/meal always gets the
// same gradient without any network call.

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export interface GradientPair {
  readonly from: string;
  readonly to: string;
}

// Curated palette of brand-consistent gradient pairs. Cycling through a
// finite, designer-approved set keeps the look cohesive even when the
// seed string changes (random hue rolls produced clashing colors).
const GRADIENT_PALETTE: readonly GradientPair[] = [
  { from: "#E04E2C", to: "#7C2D12" }, // tomato → mahogany
  { from: "#0F766E", to: "#0B3B36" }, // teal → forest
  { from: "#1E3A8A", to: "#0F1F4F" }, // deep blue
  { from: "#9333EA", to: "#5B1A93" }, // royal purple
  { from: "#B45309", to: "#7C3A06" }, // amber → bronze
  { from: "#0EA5E9", to: "#075985" } // sky → ocean
] as const;

// The default exists only as a typing safeguard; the modulo on a
// non-empty palette always lands on a defined entry.
const DEFAULT_GRADIENT: GradientPair = GRADIENT_PALETTE[0] ?? {
  from: "#E04E2C",
  to: "#7C2D12"
};

export function gradientFor(seed: string): GradientPair {
  const hash = hashString(seed);
  return GRADIENT_PALETTE[hash % GRADIENT_PALETTE.length] ?? DEFAULT_GRADIENT;
}

export function initialsFor(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return "?";
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}
