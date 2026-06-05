import { describe, expect, it } from "vitest";

import { centsToDollars, dollarsToCents, mealSchema } from "./owner.schemas";

describe("dollarsToCents", () => {
  it("converts whole dollars", () => {
    expect(dollarsToCents("12")).toBe(1_200);
  });

  it("converts dollars with cents", () => {
    expect(dollarsToCents("12.99")).toBe(1_299);
  });

  it("pads single-digit cent fractions", () => {
    expect(dollarsToCents("4.5")).toBe(450);
  });

  it("handles one cent", () => {
    expect(dollarsToCents("0.01")).toBe(1);
  });
});

describe("centsToDollars", () => {
  it("formats whole dollars without trailing zeros", () => {
    expect(centsToDollars(1_200)).toBe("12");
  });

  it("formats cents with two decimal places", () => {
    expect(centsToDollars(1_299)).toBe("12.99");
  });

  it("round-trips with dollarsToCents", () => {
    expect(centsToDollars(dollarsToCents("12.99"))).toBe("12.99");
  });
});

describe("mealSchema price validation", () => {
  it("accepts valid dollar prices", () => {
    const result = mealSchema.safeParse({
      name: "Burger",
      description: "Classic burger",
      price: "12.99",
      imageUrl: ""
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than two decimal places", () => {
    const result = mealSchema.safeParse({
      name: "Burger",
      description: "Classic burger",
      price: "1.234",
      imageUrl: ""
    });
    expect(result.success).toBe(false);
  });
});
