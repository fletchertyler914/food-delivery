import { describe, expect, it } from "vitest";

import { normalizeCouponCode } from "./coupons.service";

describe("normalizeCouponCode", () => {
  it("uppercases the code", () => {
    expect(normalizeCouponCode("summer25")).toBe("SUMMER25");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeCouponCode("  welcome ")).toBe("WELCOME");
  });

  it("is idempotent", () => {
    const once = normalizeCouponCode("save10");
    expect(normalizeCouponCode(once)).toBe(once);
  });
});
