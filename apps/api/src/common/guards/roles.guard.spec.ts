import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import type { UserRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { ResourceForbiddenError } from "../errors/resource.errors";
import type { AuthenticatedUser } from "../decorators/current-user.decorator";
import { RolesGuard } from "./roles.guard";

function buildContext(user?: AuthenticatedUser): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ user })
    })
  } as unknown as ExecutionContext;
}

function buildReflector(roles: UserRole[] | undefined): Reflector {
  return {
    getAllAndOverride: vi.fn().mockReturnValue(roles)
  } as unknown as Reflector;
}

const owner: AuthenticatedUser = {
  id: "u-1",
  email: "owner@example.com",
  role: "OWNER"
};

describe("RolesGuard", () => {
  it("allows the request when no roles are declared on the handler", () => {
    const guard = new RolesGuard(buildReflector(undefined));

    expect(guard.canActivate(buildContext(owner))).toBe(true);
  });

  it("allows the request when the declared roles list is empty", () => {
    const guard = new RolesGuard(buildReflector([]));

    expect(guard.canActivate(buildContext())).toBe(true);
  });

  it("throws ResourceForbiddenError when authentication is missing", () => {
    const guard = new RolesGuard(buildReflector(["OWNER"]));

    expect(() => guard.canActivate(buildContext(undefined))).toThrow(ResourceForbiddenError);
  });

  it("throws ResourceForbiddenError when the user has the wrong role", () => {
    const guard = new RolesGuard(buildReflector(["OWNER"]));
    const customer = { ...owner, role: "CUSTOMER" } as AuthenticatedUser;

    try {
      guard.canActivate(buildContext(customer));
      expect.unreachable("expected ResourceForbiddenError");
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceForbiddenError);
      expect((error as ResourceForbiddenError).code).toBe("RESOURCE_FORBIDDEN");
    }
  });

  it("allows the request when the user holds an allowed role", () => {
    const guard = new RolesGuard(buildReflector(["OWNER", "CUSTOMER"]));

    expect(guard.canActivate(buildContext(owner))).toBe(true);
  });
});
