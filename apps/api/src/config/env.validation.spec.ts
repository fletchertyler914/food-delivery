import { describe, expect, it } from "vitest";

import { validateEnv } from "./env.validation";

const validEnv = {
  NODE_ENV: "development",
  DATABASE_URL: "postgresql://food_delivery:food_delivery@localhost:5432/food_delivery",
  API_PORT: "3000",
  WEB_ORIGIN: "http://localhost:5173",
  JWT_ACCESS_SECRET: "replace-with-at-least-32-random-bytes",
  JWT_ACCESS_TTL: "15m",
  JWT_REFRESH_TTL_DAYS: "30"
};

describe("validateEnv", () => {
  it("parses and normalizes valid environment variables", () => {
    expect(validateEnv(validEnv)).toEqual({
      NODE_ENV: "development",
      DATABASE_URL: validEnv.DATABASE_URL,
      API_PORT: 3000,
      WEB_ORIGIN: ["http://localhost:5173"],
      JWT_ACCESS_SECRET: validEnv.JWT_ACCESS_SECRET,
      JWT_ACCESS_TTL: "15m",
      JWT_REFRESH_TTL_DAYS: 30
    });
  });

  it("parses, normalizes, and deduplicates multiple web origins", () => {
    expect(
      validateEnv({
        ...validEnv,
        WEB_ORIGIN: "http://localhost:5173, http://192.168.8.121:5173/, http://localhost:5173"
      }).WEB_ORIGIN
    ).toEqual(["http://localhost:5173", "http://192.168.8.121:5173"]);
  });

  it("rejects missing database URLs", () => {
    expect(() => validateEnv({ ...validEnv, DATABASE_URL: undefined })).toThrow(
      "DATABASE_URL is required."
    );
  });

  it("rejects short JWT secrets", () => {
    expect(() => validateEnv({ ...validEnv, JWT_ACCESS_SECRET: "too-short" })).toThrow(
      "JWT_ACCESS_SECRET must be at least 32 characters long."
    );
  });

  it("rejects placeholder secrets in production", () => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: "production" })).toThrow(
      "JWT_ACCESS_SECRET must be changed before production."
    );
  });

  it("rejects invalid duration strings", () => {
    expect(() => validateEnv({ ...validEnv, JWT_ACCESS_TTL: "fifteen minutes" })).toThrow(
      "JWT_ACCESS_TTL must be a duration like 15m, 1h, or 7d."
    );
  });
});
