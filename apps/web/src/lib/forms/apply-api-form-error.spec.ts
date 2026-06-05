import { describe, expect, it, vi } from "vitest";

import type { ApiProblem } from "@food-delivery/api-client";

import { ApiError } from "../api/client";
import { applyApiFormError } from "./apply-api-form-error";

interface FormShape {
  readonly email: string;
  readonly password: string;
}

function problem(overrides: Partial<ApiProblem> = {}): ApiProblem {
  return {
    type: "about:blank",
    title: "Invalid credentials.",
    status: 401,
    code: "INVALID_CREDENTIALS",
    ...overrides
  };
}

describe("applyApiFormError", () => {
  it("routes a mapped error code to the matching field with detail text", () => {
    const setError = vi.fn();
    const error = new ApiError(problem({ detail: "Email or password is incorrect." }));

    applyApiFormError<FormShape>(
      error,
      setError,
      { INVALID_CREDENTIALS: "password" },
      "Login failed."
    );

    expect(setError).toHaveBeenCalledWith("password", {
      message: "Email or password is incorrect."
    });
  });

  it("falls back to the title when the problem has no detail", () => {
    const setError = vi.fn();
    // Omit `detail` rather than passing `undefined` so the assertion
    // exercises the same shape the API actually sends when no detail
    // text is included in the problem document.
    const error = new ApiError({
      type: "about:blank",
      title: "Invalid credentials.",
      status: 401,
      code: "INVALID_CREDENTIALS"
    });

    applyApiFormError<FormShape>(
      error,
      setError,
      { INVALID_CREDENTIALS: "password" },
      "Login failed."
    );

    expect(setError).toHaveBeenCalledWith("password", { message: "Invalid credentials." });
  });

  it("routes unmapped API errors to the root form-level error", () => {
    const setError = vi.fn();
    const error = new ApiError(problem({ code: "UNEXPECTED_CODE", title: "Other failure" }));

    applyApiFormError<FormShape>(error, setError, {}, "Login failed.");

    expect(setError).toHaveBeenCalledWith("root", { message: "Other failure" });
  });

  it("falls back to the fallback message for non-ApiError exceptions", () => {
    const setError = vi.fn();

    applyApiFormError<FormShape>("not-an-error", setError, {}, "Login failed.");

    expect(setError).toHaveBeenCalledWith("root", { message: "Login failed." });
  });

  it("uses Error.message for generic errors", () => {
    const setError = vi.fn();

    applyApiFormError<FormShape>(new Error("Network down"), setError, {}, "Login failed.");

    expect(setError).toHaveBeenCalledWith("root", { message: "Network down" });
  });
});
