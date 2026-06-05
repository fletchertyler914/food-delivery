import { describe, expect, it, vi } from "vitest";
import type { User } from "@prisma/client";

import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  InvalidTokenLookupError,
  WeakPasswordError
} from "../../common/errors/auth.errors";
import { AuthService } from "./auth.service";

const user: User = {
  id: "user-1",
  email: "customer@example.com",
  name: "Customer",
  role: "CUSTOMER",
  passwordHash: "hash",
  createdAt: new Date(),
  updatedAt: new Date()
};

function buildService(
  overrides: {
    readonly users?: Partial<{
      create: ReturnType<typeof vi.fn>;
      findByEmail: ReturnType<typeof vi.fn>;
      findById: ReturnType<typeof vi.fn>;
      verifyPassword: ReturnType<typeof vi.fn>;
    }>;
    readonly jwt?: Partial<{ signAsync: ReturnType<typeof vi.fn> }>;
    readonly refreshTokens?: Partial<{
      issue: ReturnType<typeof vi.fn>;
      consume: ReturnType<typeof vi.fn>;
    }>;
  } = {}
): AuthService {
  const users = {
    create: vi.fn().mockResolvedValue(user),
    findByEmail: vi.fn().mockResolvedValue(user),
    findById: vi.fn().mockResolvedValue(user),
    verifyPassword: vi.fn().mockResolvedValue(true),
    ...overrides.users
  };
  const jwt = {
    signAsync: vi.fn().mockResolvedValue("access-token"),
    ...overrides.jwt
  };
  const refreshTokens = {
    issue: vi.fn().mockResolvedValue({ token: "refresh-token", record: { userId: user.id } }),
    consume: vi.fn().mockResolvedValue({ userId: user.id }),
    ...overrides.refreshTokens
  };

  return new AuthService(users as never, jwt as never, refreshTokens as never);
}

describe("AuthService", () => {
  it("signup rejects weak passwords before creating a user", async () => {
    const service = buildService();
    await expect(
      service.signup({
        email: "new@example.com",
        password: "short",
        name: "New",
        role: "CUSTOMER"
      })
    ).rejects.toBeInstanceOf(WeakPasswordError);
  });

  it("login rejects invalid credentials", async () => {
    const service = buildService({
      users: { verifyPassword: vi.fn().mockResolvedValue(false) }
    });

    await expect(
      service.login({ email: "customer@example.com", password: "Password123!" })
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("refresh maps consumed lookup failures to InvalidRefreshTokenError", async () => {
    const service = buildService({
      refreshTokens: {
        consume: vi.fn().mockRejectedValue(new InvalidTokenLookupError())
      }
    });

    await expect(service.refresh("stale-token")).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it("signup issues tokens for valid input", async () => {
    const service = buildService();
    const result = await service.signup({
      email: "new@example.com",
      password: "Password123!",
      name: "New",
      role: "CUSTOMER"
    });

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(result.user.email).toBe(user.email);
  });

  it("refresh re-issues tokens when the refresh token is valid", async () => {
    const service = buildService();
    const result = await service.refresh("valid-refresh");

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
  });

  it("refresh rejects when the user no longer exists", async () => {
    const service = buildService({
      users: { findById: vi.fn().mockResolvedValue(null) }
    });

    await expect(service.refresh("valid-refresh")).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });
});
