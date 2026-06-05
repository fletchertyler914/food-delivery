import { describe, expect, it } from "vitest";

import { loginSchema, signupSchema } from "./auth.schemas";

describe("loginSchema", () => {
  it("accepts a valid email and a non-empty password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "secret" });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "secret" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/valid email/i);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/enter your password/i);
  });
});

describe("signupSchema", () => {
  const valid = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "abcdef123456",
    role: "CUSTOMER" as const
  };

  it("accepts a complete, valid signup form", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts the OWNER role", () => {
    expect(signupSchema.safeParse({ ...valid, role: "OWNER" }).success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = signupSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/your name/i);
  });

  it("rejects a password shorter than 12 characters (mirrors the API policy)", () => {
    const result = signupSchema.safeParse({ ...valid, password: "short123" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/at least 12 characters/i);
  });

  it("rejects a role outside the allowed set", () => {
    const result = signupSchema.safeParse({ ...valid, role: "ADMIN" });
    expect(result.success).toBe(false);
  });
});
