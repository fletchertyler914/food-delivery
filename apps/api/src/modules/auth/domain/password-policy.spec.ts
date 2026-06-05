import { describe, expect, it } from "vitest";

import { assertPasswordPolicy, PASSWORD_MIN_LENGTH } from "./password-policy";

describe("assertPasswordPolicy", () => {
  it("accepts a password that meets length and content rules", () => {
    expect(assertPasswordPolicy("CorrectHorse42Battery")).toEqual({ ok: true });
  });

  it("rejects a password shorter than the minimum length", () => {
    const result = assertPasswordPolicy("Aa1".padEnd(PASSWORD_MIN_LENGTH - 1, "a"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain(String(PASSWORD_MIN_LENGTH));
    }
  });

  it("rejects a password missing a digit", () => {
    expect(assertPasswordPolicy("OnlyLettersHereForever")).toEqual({
      ok: false,
      reason: "Password must contain at least one letter and one digit."
    });
  });

  it("rejects a password missing a letter", () => {
    expect(assertPasswordPolicy("123456789012345")).toEqual({
      ok: false,
      reason: "Password must contain at least one letter and one digit."
    });
  });
});
