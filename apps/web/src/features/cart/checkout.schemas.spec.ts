import { describe, expect, it } from "vitest";

import { checkoutPaymentSchema } from "./checkout.schemas";

const valid = {
  nameOnCard: "Ada Lovelace",
  cardNumber: "4242 4242 4242 4242",
  expiry: "12/99",
  cvv: "123"
};

describe("checkoutPaymentSchema", () => {
  it("accepts a valid payment form and strips spaces from the card number", () => {
    const result = checkoutPaymentSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.cardNumber).toBe("4242424242424242");
  });

  it("rejects a missing name on card", () => {
    const result = checkoutPaymentSchema.safeParse({ ...valid, nameOnCard: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a card number with too few digits", () => {
    const result = checkoutPaymentSchema.safeParse({ ...valid, cardNumber: "4242" });
    expect(result.success).toBe(false);
  });

  it("rejects an expiry that is not in MM/YY format", () => {
    const result = checkoutPaymentSchema.safeParse({ ...valid, expiry: "2026-12" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/MM\/YY/);
  });

  it("rejects an expiry month outside 01-12", () => {
    const result = checkoutPaymentSchema.safeParse({ ...valid, expiry: "13/30" });
    expect(result.success).toBe(false);
  });

  it("rejects a card that has already expired", () => {
    const result = checkoutPaymentSchema.safeParse({ ...valid, expiry: "01/20" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/expired/i);
  });

  it("rejects a CVV that is not 3-4 digits", () => {
    const result = checkoutPaymentSchema.safeParse({ ...valid, cvv: "12" });
    expect(result.success).toBe(false);
  });
});
