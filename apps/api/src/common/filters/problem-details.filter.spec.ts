import type { ArgumentsHost } from "@nestjs/common";
import { BadRequestException, ForbiddenException, Logger } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DomainError } from "../errors/domain-error";
import { ProblemDetailsFilter } from "./problem-details.filter";

interface CapturedResponse {
  status: ReturnType<typeof vi.fn>;
  type: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  body: unknown;
  statusCode: number;
}

function buildHost(request: Record<string, unknown> = {}): {
  host: ArgumentsHost;
  response: CapturedResponse;
} {
  const response: CapturedResponse = {
    body: undefined,
    statusCode: 0,
    status: vi.fn(),
    type: vi.fn(),
    json: vi.fn()
  };

  // Each Express response method returns the response so the filter can
  // chain `.status().type().json()`.
  response.status = vi.fn((code: number) => {
    response.statusCode = code;
    return response;
  });
  response.type = vi.fn(() => response);
  response.json = vi.fn((payload: unknown) => {
    response.body = payload;
    return response;
  });

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request
    })
  } as unknown as ArgumentsHost;

  return { host, response };
}

class CustomerBlockedError extends DomainError {
  constructor() {
    super({
      code: "CUSTOMER_BLOCKED",
      message: "You are blocked.",
      status: 403,
      detail: "blocked by owner"
    });
  }
}

describe("ProblemDetailsFilter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a DomainError as problem+json with code, status, and detail", () => {
    const filter = new ProblemDetailsFilter();
    const { host, response } = buildHost({ requestId: "req-123" });

    filter.catch(new CustomerBlockedError(), host);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.type).toHaveBeenCalledWith("application/problem+json");
    expect(response.body).toEqual({
      type: "https://food-delivery.local/problems/CUSTOMER_BLOCKED",
      title: "You are blocked.",
      status: 403,
      code: "CUSTOMER_BLOCKED",
      detail: "blocked by owner",
      requestId: "req-123"
    });
  });

  it("maps a BadRequestException to VALIDATION_FAILED with per-message errors", () => {
    const filter = new ProblemDetailsFilter();
    const { host, response } = buildHost();

    filter.catch(new BadRequestException(["email must be valid", "name is required"]), host);

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({
      status: 400,
      code: "VALIDATION_FAILED",
      errors: [
        { path: "", message: "email must be valid" },
        { path: "", message: "name is required" }
      ]
    });
  });

  it("maps a non-400 HttpException to an HTTP_<status> code", () => {
    const filter = new ProblemDetailsFilter();
    const { host, response } = buildHost({ id: 42 });

    filter.catch(new ForbiddenException("nope"), host);

    expect(response.statusCode).toBe(403);
    expect(response.body).toMatchObject({
      status: 403,
      code: "HTTP_403",
      requestId: "42"
    });
  });

  it("logs and renders a generic 500 for unknown errors", () => {
    const errorSpy = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const filter = new ProblemDetailsFilter();
    const { host, response } = buildHost({ requestId: "req-err" });

    filter.catch(new Error("boom"), host);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      type: "https://food-delivery.local/problems/internal-server-error",
      title: "Internal server error",
      status: 500,
      code: "INTERNAL_SERVER_ERROR",
      requestId: "req-err"
    });
  });

  it("stringifies non-Error throwables when logging the unknown branch", () => {
    const errorSpy = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const filter = new ProblemDetailsFilter();
    const { host, response } = buildHost();

    filter.catch("just a string", host);

    expect(errorSpy).toHaveBeenCalledWith("just a string", undefined);
    expect(response.statusCode).toBe(500);
    expect(response.body).not.toHaveProperty("requestId");
  });
});
