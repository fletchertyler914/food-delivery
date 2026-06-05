import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { describe, expect, it, vi } from "vitest";

import { AccessTokenExpiredError, InvalidBearerError } from "../errors/auth.errors";
import { JwtAuthGuard } from "./jwt-auth.guard";

function buildContext(): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined
  } as unknown as ExecutionContext;
}

function buildReflector(isPublic: boolean | undefined): Reflector {
  return {
    getAllAndOverride: vi.fn().mockReturnValue(isPublic)
  } as unknown as Reflector;
}

interface TestUser {
  readonly id: string;
}

describe("JwtAuthGuard", () => {
  it("short-circuits to true for routes marked @Public()", () => {
    const guard = new JwtAuthGuard(buildReflector(true));

    expect(guard.canActivate(buildContext())).toBe(true);
  });

  it("returns the authenticated user when passport resolves one", () => {
    const guard = new JwtAuthGuard(buildReflector(false));
    const user: TestUser = { id: "u-1" };

    expect(guard.handleRequest<TestUser>(undefined, user, undefined)).toEqual(user);
  });

  it("throws InvalidBearerError when no user and no info is provided (missing token)", () => {
    const guard = new JwtAuthGuard(buildReflector(false));

    expect(() => guard.handleRequest(undefined, false, undefined)).toThrow(InvalidBearerError);
  });

  it("throws AccessTokenExpiredError when passport reports an expired token", () => {
    const guard = new JwtAuthGuard(buildReflector(false));
    const expired = Object.assign(new Error("jwt expired"), { name: "TokenExpiredError" });

    expect(() => guard.handleRequest(undefined, false, expired)).toThrow(AccessTokenExpiredError);
  });

  it("re-throws an upstream passport error untouched", () => {
    const guard = new JwtAuthGuard(buildReflector(false));
    const boom = new Error("strategy failure");

    expect(() => guard.handleRequest(boom, false, undefined)).toThrow(boom);
  });
});
