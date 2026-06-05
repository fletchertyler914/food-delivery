// Centralized date/time formatting so every list and detail surface
// reads the same. The locale is fixed to en-US for predictability in
// snapshot tests; switch to a runtime locale once we add i18n.

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric"
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

export function formatDate(value: string | Date): string {
  return DATE_FORMATTER.format(typeof value === "string" ? new Date(value) : value);
}

export function formatDateTime(value: string | Date): string {
  return DATE_TIME_FORMATTER.format(typeof value === "string" ? new Date(value) : value);
}

// Relative-only display for very recent items, falling back to an
// absolute date once the gap is meaningful (>= 7 days).
export function formatRelative(value: string | Date, now: Date = new Date()): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const deltaMs = date.getTime() - now.getTime();
  const seconds = Math.round(deltaMs / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (Math.abs(seconds) < 60) {
    return RELATIVE_FORMATTER.format(seconds, "second");
  }
  if (Math.abs(minutes) < 60) {
    return RELATIVE_FORMATTER.format(minutes, "minute");
  }
  if (Math.abs(hours) < 24) {
    return RELATIVE_FORMATTER.format(hours, "hour");
  }
  if (Math.abs(days) < 7) {
    return RELATIVE_FORMATTER.format(days, "day");
  }
  return formatDate(date);
}

export function shortId(id: string): string {
  return id.slice(-6).toUpperCase();
}
