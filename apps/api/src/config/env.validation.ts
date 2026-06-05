const NODE_ENV_VALUES = ["development", "test", "production"] as const;

type NodeEnv = (typeof NODE_ENV_VALUES)[number];

export interface EnvConfig {
  readonly NODE_ENV: NodeEnv;
  readonly DATABASE_URL: string;
  readonly API_PORT: number;
  readonly WEB_ORIGIN: readonly string[];
  readonly JWT_ACCESS_SECRET: string;
  readonly JWT_ACCESS_TTL: string;
  readonly JWT_REFRESH_TTL_DAYS: number;
}

export function validateEnv(input: Record<string, unknown>): EnvConfig {
  const nodeEnv = parseNodeEnv(input["NODE_ENV"] ?? "development");

  return {
    NODE_ENV: nodeEnv,
    DATABASE_URL: parsePostgresUrl(input["DATABASE_URL"], "DATABASE_URL"),
    API_PORT: parsePort(input["API_PORT"] ?? "3000", "API_PORT"),
    WEB_ORIGIN: parseHttpOrigins(input["WEB_ORIGIN"] ?? "http://localhost:5173", "WEB_ORIGIN"),
    JWT_ACCESS_SECRET: parseJwtSecret(input["JWT_ACCESS_SECRET"], nodeEnv),
    JWT_ACCESS_TTL: parseDuration(input["JWT_ACCESS_TTL"] ?? "15m", "JWT_ACCESS_TTL"),
    JWT_REFRESH_TTL_DAYS: parsePositiveInt(
      input["JWT_REFRESH_TTL_DAYS"] ?? "30",
      "JWT_REFRESH_TTL_DAYS"
    )
  };
}

function parseNodeEnv(value: unknown): NodeEnv {
  if (typeof value !== "string" || !NODE_ENV_VALUES.includes(value as NodeEnv)) {
    throw new Error(`NODE_ENV must be one of: ${NODE_ENV_VALUES.join(", ")}.`);
  }
  return value as NodeEnv;
}

function parseRequiredString(value: unknown, key: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required.`);
  }
  return value.trim();
}

function parsePostgresUrl(value: unknown, key: string): string {
  const url = parseRequiredString(value, key);
  const parsed = parseUrl(url, key);
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error(`${key} must use the postgresql:// protocol.`);
  }
  return url;
}

function parseHttpOrigins(value: unknown, key: string): readonly string[] {
  const origins = parseRequiredString(value, key)
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
    .map((origin) => parseHttpOrigin(origin, key));

  if (origins.length === 0) {
    throw new Error(`${key} must include at least one http(s) origin.`);
  }

  return Array.from(new Set(origins));
}

function parseHttpOrigin(value: unknown, key: string): string {
  const origin = parseRequiredString(value, key);
  const parsed = parseUrl(origin, key);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${key} must be an http(s) origin.`);
  }
  return parsed.origin;
}

function parseUrl(value: string, key: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new Error(`${key} must be a valid URL.`);
  }
}

function parsePort(value: unknown, key: string): number {
  const port = parsePositiveInt(value, key);
  if (port > 65_535) {
    throw new Error(`${key} must be between 1 and 65535.`);
  }
  return port;
}

function parsePositiveInt(value: unknown, key: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer.`);
  }
  return parsed;
}

function parseJwtSecret(value: unknown, nodeEnv: NodeEnv): string {
  const secret = parseRequiredString(value, "JWT_ACCESS_SECRET");
  if (secret.length < 32) {
    throw new Error("JWT_ACCESS_SECRET must be at least 32 characters long.");
  }
  if (nodeEnv === "production" && secret.includes("replace-with")) {
    throw new Error("JWT_ACCESS_SECRET must be changed before production.");
  }
  return secret;
}

function parseDuration(value: unknown, key: string): string {
  const duration = parseRequiredString(value, key);
  if (!/^\d+(ms|s|m|h|d)$/.test(duration)) {
    throw new Error(`${key} must be a duration like 15m, 1h, or 7d.`);
  }
  return duration;
}
