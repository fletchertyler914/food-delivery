import { describe, expect, it } from "vitest";

import {
  addCents,
  cents,
  discountCents,
  InvalidCentsError,
  InvalidDiscountPercentError
} from "./money";

describe("money helpers", () => {
  describe("cents()", () => {
    it("returns the value unchanged for non-negative integers", () => {
      expect(cents(0)).toBe(0);
      expect(cents(1)).toBe(1);
      expect(cents(123_456)).toBe(123_456);
    });

    it.each([-1, -0.0001, 0.5, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
      "throws InvalidCentsError for %s",
      (value) => {
        expect(() => cents(value)).toThrow(InvalidCentsError);
      }
    );

    it("attaches a stable problem code to InvalidCentsError", () => {
      try {
        cents(-1);
        throw new Error("expected throw");
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidCentsError);
        if (error instanceof InvalidCentsError) {
          expect(error.code).toBe("INVALID_PRICING_INPUT");
          expect(error.status).toBe(400);
        }
      }
    });
  });

  describe("addCents()", () => {
    it("returns 0 for the empty sum", () => {
      expect(addCents([])).toBe(0);
    });

    it("sums a series of non-negative cent values", () => {
      expect(addCents([cents(100), cents(200), cents(50)])).toBe(350);
    });

    it("re-throws if any input or the resulting sum is invalid", () => {
      expect(() => addCents([cents(0), -1 as never])).toThrow(InvalidCentsError);
    });
  });

  describe("discountCents()", () => {
    it("returns 0 when percentOff is 0", () => {
      expect(discountCents(cents(2_499), 0)).toBe(0);
    });

    it("returns the whole subtotal when percentOff is 100", () => {
      expect(discountCents(cents(2_499), 100)).toBe(2_499);
    });

    it("floors fractional cents so we never over-discount", () => {
      // 2499 * 33 / 100 = 824.67 -> 824
      expect(discountCents(cents(2_499), 33)).toBe(824);
      // 999 * 7 / 100 = 69.93 -> 69
      expect(discountCents(cents(999), 7)).toBe(69);
    });

    it.each([-1, 101, 1.5, Number.NaN])(
      "throws InvalidDiscountPercentError for percentOff=%s",
      (value) => {
        expect(() => discountCents(cents(1_000), value)).toThrow(InvalidDiscountPercentError);
      }
    );
  });
});
