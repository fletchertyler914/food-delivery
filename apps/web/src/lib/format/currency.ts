export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(cents / 100);
}

// Money invariant: cents are the canonical unit on the wire. These
// helpers exist so user-facing inputs can speak dollars while the
// rest of the system stays in integer cents.

export function dollarsToCents(input: string): number {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return Number.NaN;
  }
  const parts = trimmed.split(".");
  const wholePart = parts[0] ?? "0";
  const fractionPart = parts[1] ?? "";
  const dollars = Number.parseInt(wholePart.length > 0 ? wholePart : "0", 10);
  if (!Number.isFinite(dollars)) {
    return Number.NaN;
  }
  const centsPart = fractionPart.padEnd(2, "0").slice(0, 2);
  const cents = centsPart.length > 0 ? Number.parseInt(centsPart, 10) : 0;
  if (!Number.isFinite(cents)) {
    return Number.NaN;
  }
  return dollars * 100 + cents;
}

export function centsToDollars(cents: number): string {
  const dollars = Math.floor(cents / 100);
  const remainder = cents % 100;
  if (remainder === 0) {
    return String(dollars);
  }
  return `${String(dollars)}.${String(remainder).padStart(2, "0")}`;
}
