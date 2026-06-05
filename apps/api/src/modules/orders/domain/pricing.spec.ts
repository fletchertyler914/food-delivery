import { describe, expect, it } from "vitest";

import { InvalidCentsError } from "./money";
import { cents } from "./money";
import { computePricing, EmptyOrderError, InvalidQuantityError } from "./pricing";

describe("computePricing", () => {
  it("computes subtotal, discount, tip, and total using integer cents", () => {
    expect(
      computePricing({
        items: [
          { priceCents: cents(999), quantity: 2 },
          { priceCents: cents(501), quantity: 1 }
        ],
        couponPercentOff: 33,
        tipCents: cents(250)
      })
    ).toEqual({
      subtotalCents: cents(2_499),
      discountCents: cents(824),
      totalCents: cents(1_925)
    });
  });

  it("treats an undefined coupon as 0% off", () => {
    expect(
      computePricing({
        items: [{ priceCents: cents(1_000), quantity: 1 }],
        tipCents: cents(0)
      })
    ).toEqual({
      subtotalCents: cents(1_000),
      discountCents: cents(0),
      totalCents: cents(1_000)
    });
  });

  it("supports a 100% coupon resulting in total === tip", () => {
    expect(
      computePricing({
        items: [{ priceCents: cents(1_000), quantity: 3 }],
        couponPercentOff: 100,
        tipCents: cents(200)
      })
    ).toEqual({
      subtotalCents: cents(3_000),
      discountCents: cents(3_000),
      totalCents: cents(200)
    });
  });

  it("rejects an empty cart", () => {
    expect(() => computePricing({ items: [], tipCents: cents(0) })).toThrow(EmptyOrderError);
  });

  it.each([0, -1, 1.5, Number.POSITIVE_INFINITY, Number.NaN])(
    "rejects non-positive-integer quantities (%s)",
    (quantity) => {
      expect(() =>
        computePricing({
          items: [{ priceCents: cents(100), quantity }],
          tipCents: cents(0)
        })
      ).toThrow(InvalidQuantityError);
    }
  );

  it("rejects negative tip via InvalidCentsError from money helpers", () => {
    expect(() =>
      computePricing({
        items: [{ priceCents: cents(100), quantity: 1 }],
        tipCents: -1 as never
      })
    ).toThrow(InvalidCentsError);
  });

  it("rejects coupon percent out of [0, 100] via discountCents", () => {
    expect(() =>
      computePricing({
        items: [{ priceCents: cents(100), quantity: 1 }],
        tipCents: cents(0),
        couponPercentOff: 101
      })
    ).toThrow();

    expect(() =>
      computePricing({
        items: [{ priceCents: cents(100), quantity: 1 }],
        tipCents: cents(0),
        couponPercentOff: -1
      })
    ).toThrow();
  });

  it("never floors below zero when applying a near-100% coupon", () => {
    // 1 cent at 99% off = 0.01 -> floor -> 0
    const result = computePricing({
      items: [{ priceCents: cents(1), quantity: 1 }],
      tipCents: cents(0),
      couponPercentOff: 99
    });
    expect(result.discountCents).toBe(0);
    expect(result.totalCents).toBe(1);
  });

  it("handles very large carts without overflowing the integer contract", () => {
    const result = computePricing({
      items: Array.from({ length: 50 }, () => ({ priceCents: cents(9_999), quantity: 99 })),
      tipCents: cents(0)
    });
    // 50 items * 9999 * 99 = 49,495,050
    expect(result.subtotalCents).toBe(49_495_050);
    expect(Number.isInteger(result.subtotalCents)).toBe(true);
  });
});
