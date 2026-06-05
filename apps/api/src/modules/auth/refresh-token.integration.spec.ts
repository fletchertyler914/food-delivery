import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { InvalidTokenLookupError } from "../../common/errors/auth.errors";
import { RefreshTokenService } from "./refresh-token.service";
import { UsersService } from "../users/users.service";
import { createIntegrationApp, type IntegrationApp } from "../../../test/integration-app";

// Two simultaneous /auth/refresh requests with the same refresh
// cookie must not both succeed. The repository contract is that
// `tokenHash` is `@@unique` and consume is a single
// `updateMany({ where: { tokenHash, revokedAt: null, expiresAt: { gt: now } }, data: { revokedAt: now } })`,
// so only one of the two transactions can flip `revokedAt` from null.
describe("RefreshTokenService concurrent consume", () => {
  let testApp: IntegrationApp | undefined;
  let refreshTokens: RefreshTokenService;
  let users: UsersService;

  beforeAll(async () => {
    testApp = await createIntegrationApp();
    refreshTokens = testApp.app.get(RefreshTokenService);
    users = testApp.app.get(UsersService);
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it("allows exactly one of two parallel consume calls to succeed", async () => {
    const suffix = crypto.randomUUID();
    const user = await users.create({
      email: `race-${suffix}@example.com`,
      name: "Race Customer",
      password: "CorrectHorse42Battery",
      role: "CUSTOMER"
    });

    const { token } = await refreshTokens.issue(user.id);

    const results = await Promise.allSettled([
      refreshTokens.consume(token),
      refreshTokens.consume(token)
    ]);

    const fulfilled = results.filter(
      (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof refreshTokens.consume>>> =>
        r.status === "fulfilled"
    );
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toBeInstanceOf(InvalidTokenLookupError);
  });

  it("rejects re-consume of a successfully consumed token", async () => {
    const suffix = crypto.randomUUID();
    const user = await users.create({
      email: `reuse-${suffix}@example.com`,
      name: "Reuse Customer",
      password: "CorrectHorse42Battery",
      role: "CUSTOMER"
    });

    const { token } = await refreshTokens.issue(user.id);

    await expect(refreshTokens.consume(token)).resolves.toMatchObject({ userId: user.id });
    await expect(refreshTokens.consume(token)).rejects.toBeInstanceOf(InvalidTokenLookupError);
  });
});
