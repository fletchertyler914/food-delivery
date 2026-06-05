import { describe, expect, it } from "vitest";

import { ApiError } from "../api/client";

import { getErrorMessage } from "./get-error-message";

describe("getErrorMessage", () => {
  it("returns problem details for ApiError", () => {
    const error = new ApiError({
      type: "about:blank",
      title: "Bad Request",
      status: 400,
      code: "COUPON_INVALID",
      detail: "Coupon is invalid"
    });

    expect(getErrorMessage(error, "fallback")).toBe("Coupon is invalid");
  });

  it("falls back to the error message or provided default", () => {
    expect(getErrorMessage(new Error("network down"), "fallback")).toBe("network down");
    expect(getErrorMessage("boom", "fallback")).toBe("fallback");
  });
});
