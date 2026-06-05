/**
 * Strip keys whose value is `undefined`. Useful for building Prisma
 * `data` payloads from partial DTOs under `exactOptionalPropertyTypes`,
 * where the input types reject explicit `undefined`.
 */
export function pickDefined<T extends Record<string, unknown>>(
  source: T
): { [K in keyof T]: Exclude<T[K], undefined> } {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as { [K in keyof T]: Exclude<T[K], undefined> };
}
